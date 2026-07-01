let siteConfig = {
  brandName: 'ZENITH',
  tiktokHandle: '@tristymindagym',
  tiktokUrl: 'https://www.tiktok.com/@tristymindagym',
  contactEmail: 'synastyles@gmail.com',
  checkoutLinks: {}
};

fetch('site-config.json').then(r => r.ok ? r.json() : null).then(cfg => {
  if (cfg) siteConfig = { ...siteConfig, ...cfg, checkoutLinks: { ...siteConfig.checkoutLinks, ...(cfg.checkoutLinks || {}) } };
  applyConfig();
}).catch(applyConfig);

function applyConfig() {
  const tikTok = document.getElementById('tiktokLink');
  if (tikTok) { tikTok.href = siteConfig.tiktokUrl; tikTok.textContent = 'TikTok ansehen'; }
  const mail = document.getElementById('mailLink');
  if (mail) { mail.href = `mailto:${siteConfig.contactEmail}`; mail.textContent = siteConfig.contactEmail; }
}

// Reveal is purely cosmetic: CSS keeps content at opacity:1 at all times and only
// applies a subtle upward settle (transform) while .reveal-ready is set. Visibility
// never depends on JS, the observer, or timing — so full-page screenshots and
// no-JS render every section. The observer just settles elements as they scroll in.
const revealTargets = document.querySelectorAll('[data-reveal]');
if ('IntersectionObserver' in window) {
  document.documentElement.classList.add('reveal-ready');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
  revealTargets.forEach(el => revealObserver.observe(el));
  // Safety net: settle anything not yet reached shortly after load.
  window.addEventListener('load', () => {
    setTimeout(() => revealTargets.forEach(el => el.classList.add('is-visible')), 600);
  });
}

const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(open));
  });
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  }));
}

const emailForm = document.getElementById('emailForm');
if (emailForm) {
  emailForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = document.getElementById('emailInput');
    const email = input.value.trim();
    if (!email) return;
    const subject = encodeURIComponent('Frage zum ZENITH Gym Coaching');
    const body = encodeURIComponent(`Hi Tristan,\n\nich habe eine Frage zum Coaching.\n\nMeine E-Mail: ${email}\n\n`);
    window.location.href = `mailto:${siteConfig.contactEmail}?subject=${subject}&body=${body}`;
    const status = document.getElementById('emailStatus');
    if (status) status.textContent = 'Deine E-Mail-App öffnet sich mit einer vorbereiteten Nachricht an mich.';
  });
}

/* ===================== Newsletter ===================== */
(function newsletter() {
  const form = document.getElementById('newsletterForm');
  if (!form) return;
  const input = document.getElementById('newsletterEmail');
  const interestEl = document.getElementById('newsletterInterest');
  const status = document.getElementById('newsletterStatus');
  const submit = document.getElementById('newsletterSubmit');
  const setStat = (msg, kind) => { if (status) { status.className = 'newsletter-status' + (kind ? ' ' + kind : ''); status.textContent = msg; } };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = input ? input.value.trim() : '';
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setStat('Bitte gib eine gültige E-Mail-Adresse ein.', 'error'); if (input) input.focus(); return; }
    if (submit) submit.disabled = true;
    setStat('Einen Moment …', null);
    let data = null;
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'landingpage', interest: interestEl ? interestEl.value : '' })
      });
      data = await res.json().catch(() => null);
    } catch (e) { data = null; }
    if (submit) submit.disabled = false;
    if (data && data.ok) {
      setStat(data.message || 'Eingetragen! Danke, dass du dabei bist.', 'ok');
      if (input) input.value = '';
    } else {
      const msg = (data && data.message) ? data.message : 'Eintragen ist gerade nicht möglich (evtl. statische Vorschau). Schreib mir gern direkt per E-Mail.';
      setStat(msg, 'error');
    }
  });
})();

/* ===================== Warenkorb + Checkout ===================== */
(function cartSystem() {
  const CART_KEY = 'zenith_cart_v1';
  let productMap = {};
  let products = [];

  const $ = (id) => document.getElementById(id);
  const cartButton = $('cartButton');
  const cartDrawer = $('cartDrawer');
  const cartItemsEl = $('cartItems');
  const cartCountEl = $('cartCount');
  const cartTotalEl = $('cartTotal');
  const cartCheckoutBtn = $('cartCheckout');
  const cartClearBtn = $('cartClear');
  const cartLive = $('cartLive');
  const checkoutModal = $('checkoutModal');
  const checkoutSummary = $('checkoutSummary');
  const checkoutTotal = $('checkoutTotal');
  const checkoutForm = $('checkoutForm');
  const checkoutStatus = $('checkoutStatus');
  const checkoutSubmit = $('checkoutSubmit');
  const legalTermsText = $('legalTermsText');
  const checkoutCode = $('checkoutCode');
  const applyCodeBtn = $('applyCode');
  const discountStatus = $('discountStatus');

  let lastFocus = null;
  let checkoutMode = null; // 'demo' | 'live' | null(unknown)
  let appliedDiscount = null; // last validated discount summary from the server

  function euro(cents) {
    const v = cents / 100;
    return Number.isInteger(v) ? `€${v}` : `€${v.toFixed(2).replace('.', ',')}`;
  }
  function announce(msg) { if (cartLive) cartLive.textContent = msg; }
  function lockScroll(on) { document.documentElement.style.overflow = on ? 'hidden' : ''; }

  function getCart() {
    let ids = [];
    try { ids = JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch (e) { ids = []; }
    if (!Array.isArray(ids)) ids = [];
    // keep only known products, dedupe (digital products: quantity 1)
    return [...new Set(ids.filter(id => productMap[id]))];
  }
  function saveCart(ids) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(ids)); } catch (e) { /* storage may be blocked */ }
  }
  function cartTotalCents() { return getCart().reduce((sum, id) => sum + (productMap[id]?.priceCents || 0), 0); }

  function updateCount() {
    const n = getCart().length;
    if (cartCountEl) { cartCountEl.textContent = String(n); cartCountEl.setAttribute('data-empty', String(n === 0)); }
    if (cartButton) cartButton.setAttribute('aria-label', n ? `Warenkorb öffnen (${n})` : 'Warenkorb öffnen');
  }

  function renderCart() {
    const ids = getCart();
    if (cartItemsEl) {
      if (!ids.length) {
        cartItemsEl.innerHTML = '<div class="cart-empty"><b>Dein Warenkorb ist leer.</b>Stöbere durch die <a href="#pakete" data-close-cart>Pakete</a> oder <a href="#add-ons" data-close-cart>Mini-Pläne</a> und leg einen Plan rein.</div>';
      } else {
        cartItemsEl.innerHTML = ids.map(id => {
          const p = productMap[id];
          const kind = p.type === 'package' ? 'Paket' : 'Mini-Plan';
          return `<div class="cart-item"><span class="ci-type">${kind}</span><h3>${escapeHtml(p.title)}</h3><span class="ci-price">${euro(p.priceCents)}</span><button class="ci-remove" type="button" data-remove="${id}">Entfernen</button></div>`;
        }).join('');
      }
    }
    const total = cartTotalCents();
    if (cartTotalEl) cartTotalEl.textContent = euro(total);
    if (cartCheckoutBtn) cartCheckoutBtn.disabled = ids.length === 0;
    if (cartClearBtn) cartClearBtn.hidden = ids.length === 0;
    updateCount();
  }

  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  function addToCart(id) {
    if (!productMap[id]) return;
    const ids = getCart();
    if (!ids.includes(id)) { ids.push(id); saveCart(ids); }
    renderCart();
    announce(`${productMap[id].title} wurde in den Warenkorb gelegt.`);
    openCart();
  }
  function removeFromCart(id) {
    saveCart(getCart().filter(x => x !== id));
    renderCart();
    announce('Artikel entfernt.');
  }
  function clearCart() { saveCart([]); renderCart(); announce('Warenkorb geleert.'); }

  function openCart() {
    if (!cartDrawer) return;
    lastFocus = document.activeElement;
    cartDrawer.hidden = false;
    lockScroll(true);
    const closeBtn = cartDrawer.querySelector('[data-close-cart]');
    if (closeBtn) closeBtn.focus();
  }
  function closeCart() {
    if (!cartDrawer) return;
    cartDrawer.hidden = true;
    if (checkoutModal && checkoutModal.hidden) lockScroll(false);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  async function fetchAccountState() {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 2500);
      const res = await fetch('/api/me', { signal: ctrl.signal });
      clearTimeout(t);
      if (!res.ok) throw new Error('status ' + res.status);
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  function renderCheckoutSummary() {
    const ids = getCart();
    if (checkoutSummary) {
      checkoutSummary.innerHTML = ids.map(id => {
        const p = productMap[id];
        return `<div class="cs-row"><strong>${escapeHtml(p.title)}</strong><span>${euro(p.priceCents)}</span></div>`;
      }).join('');
    }
    updateCheckoutTotal();
  }

  // Only ever shows a reduced total when Stripe will truly charge it (stripeApplied).
  // A preview-only code keeps the regular total so we never promise a lower price.
  function updateCheckoutTotal() {
    if (!checkoutTotal) return;
    const total = cartTotalCents();
    if (appliedDiscount && appliedDiscount.ok && appliedDiscount.stripeApplied) {
      checkoutTotal.innerHTML = `<span class="was">${euro(total)}</span>${euro(appliedDiscount.newTotalCents)}`;
    } else {
      checkoutTotal.textContent = euro(total);
    }
  }

  function setDiscountStatus(text, kind) {
    if (!discountStatus) return;
    discountStatus.className = 'discount-status' + (kind ? ' ' + kind : '');
    discountStatus.textContent = text;
  }

  async function applyDiscount() {
    if (!checkoutCode) return;
    const code = checkoutCode.value.trim();
    if (!code) { appliedDiscount = null; setDiscountStatus('', null); updateCheckoutTotal(); return; }
    const ids = getCart();
    if (!ids.length) { setDiscountStatus('Dein Warenkorb ist leer.', 'error'); return; }
    if (applyCodeBtn) applyCodeBtn.disabled = true;
    setDiscountStatus('Code wird geprüft …', null);
    let data = null;
    try {
      const res = await fetch('/api/discount/validate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: ids, code })
      });
      data = await res.json().catch(() => null);
    } catch (e) { data = null; }
    if (applyCodeBtn) applyCodeBtn.disabled = false;
    if (!data) { appliedDiscount = null; updateCheckoutTotal(); setDiscountStatus('Code konnte gerade nicht geprüft werden. Du kannst trotzdem fortfahren.', 'info'); return; }
    if (!data.ok) { appliedDiscount = null; updateCheckoutTotal(); setDiscountStatus(data.message || 'Dieser Code ist ungültig.', 'error'); return; }
    appliedDiscount = data;
    updateCheckoutTotal();
    if (data.stripeApplied) {
      setDiscountStatus(`Code ${data.code} aktiv: −${data.discountLabel}. Neuer Gesamtbetrag ${data.newTotalLabel} — genau so berechnet Stripe.`, 'ok');
    } else {
      setDiscountStatus(`Code ${data.code} vorgemerkt${data.campaignName ? ' (' + data.campaignName + ')' : ''}. Der Rabatt von ${data.discountLabel} ist noch nicht bei Stripe aktiviert — aktuell wird der reguläre Preis berechnet. Sobald der Code hinterlegt ist, greift er automatisch.`, 'info');
    }
  }

  function setStatus(text, kind) {
    if (!checkoutStatus) return;
    checkoutStatus.className = 'checkout-status' + (kind ? ' ' + kind : '');
    checkoutStatus.innerHTML = text;
  }

  function mailtoOrder() {
    const ids = getCart();
    const lines = ids.map(id => `- ${productMap[id].title} (${productMap[id].priceLabel})`).join('\n');
    const total = euro(cartTotalCents());
    const email = ($('checkoutEmail') && $('checkoutEmail').value.trim()) || '';
    const subject = encodeURIComponent('ZENITH Bestellanfrage');
    const body = encodeURIComponent(`Hi Tristan,\n\nich möchte folgende Pläne bestellen:\n${lines}\n\nGesamt: ${total}\nMeine E-Mail: ${email}\n\n`);
    return `mailto:${siteConfig.contactEmail}?subject=${subject}&body=${body}`;
  }

  async function openCheckout() {
    if (!checkoutModal) return;
    if (!getCart().length) { openCart(); return; }
    lastFocus = document.activeElement;
    appliedDiscount = null;
    if (checkoutCode) checkoutCode.value = '';
    setDiscountStatus('', null);
    renderCheckoutSummary();
    setStatus('', null);
    checkoutModal.hidden = false;
    lockScroll(true);
    const emailInput = $('checkoutEmail');
    if (emailInput) emailInput.focus();
    // One call: account state + live/demo mode. Prefill email when logged in.
    const me = await fetchAccountState();
    checkoutMode = me ? (me.checkoutMode === 'live' ? 'live' : 'demo') : 'offline';
    if (me && me.loggedIn && me.user && emailInput) { emailInput.value = me.user.email; }
    if (checkoutMode === 'live') {
      if (legalTermsText) legalTermsText.textContent = 'Ich verlange ausdrücklich, dass mit der Bereitstellung der digitalen Inhalte sofort nach der Zahlung begonnen wird. Mir ist bekannt, dass mein Widerrufsrecht mit Beginn der Bereitstellung erlischt.';
      if (checkoutSubmit) checkoutSubmit.textContent = 'Sicher bezahlen';
      let liveNote = 'Du wirst zur sicheren Stripe-Bezahlseite weitergeleitet. Nach der Zahlung bekommst du einen persönlichen Zugangslink zu deinen Plänen.';
      if (me && me.googleConfigured === false) {
        liveNote += ' Ein Google-Login ist dafür nicht nötig — der Konto-Login ist optional und derzeit nicht eingerichtet.';
      }
      setStatus(liveNote, null);
    } else {
      if (legalTermsText) legalTermsText.textContent = 'Mir ist klar, dass dies ein Vorschau-/Demo-Modus ist und keine echte Zahlung ausgelöst wird.';
      if (checkoutSubmit) checkoutSubmit.textContent = 'Bestellung prüfen';
      const why = checkoutMode === 'offline'
        ? 'Der Checkout-Server läuft hier nicht (statische Vorschau).'
        : 'Der Zahlungsanbieter (Stripe) ist noch nicht hinterlegt.';
      setStatus(`<span class="checkout-note">Demo-Modus: ${why} Es wird <strong>keine Zahlung</strong> ausgelöst. Du kannst deine Auswahl als unverbindliche Bestellanfrage per E-Mail senden.</span>`, 'demo');
    }
  }
  function closeCheckout() {
    if (!checkoutModal) return;
    checkoutModal.hidden = true;
    if (cartDrawer && cartDrawer.hidden) lockScroll(false);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  async function submitCheckout(event) {
    event.preventDefault();
    const emailInput = $('checkoutEmail');
    const legalContent = $('legalContent');
    const legalAccept = $('legalAccept');
    const legalTerms = $('legalTerms');
    const email = emailInput ? emailInput.value.trim() : '';
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setStatus('Bitte gib eine gültige E-Mail-Adresse ein.', 'error'); if (emailInput) emailInput.focus(); return; }
    if (!legalContent || !legalContent.checked || !legalAccept || !legalAccept.checked || !legalTerms || !legalTerms.checked) { setStatus('Bitte bestätige alle Hinweise, um fortzufahren.', 'error'); return; }
    const ids = getCart();
    if (!ids.length) { setStatus('Dein Warenkorb ist leer.', 'error'); return; }

    if (checkoutSubmit) { checkoutSubmit.disabled = true; checkoutSubmit.textContent = 'Einen Moment …'; }
    let data = null;
    try {
      const code = checkoutCode ? checkoutCode.value.trim() : '';
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: ids, email, code })
      });
      data = await res.json().catch(() => null);
      if (res.ok && data && data.mode === 'live' && data.url) {
        setStatus('Weiterleitung zur sicheren Bezahlseite …', null);
        window.location.href = data.url;
        return;
      }
    } catch (e) { data = null; }

    // Demo / offline / setup: never claim a payment happened.
    const link = mailtoOrder();
    const msg = (data && data.message)
      ? data.message
      : 'Es wurde keine Zahlung ausgelöst (Demo-/Setup-Modus).';
    setStatus(`<span class="checkout-note">${escapeHtml(msg)} <br><a class="button ghost full" style="margin-top:10px" href="${link}">Bestellanfrage per E-Mail senden</a></span>`, 'demo');
    if (checkoutSubmit) { checkoutSubmit.disabled = false; checkoutSubmit.textContent = checkoutMode === 'live' ? 'Sicher bezahlen' : 'Bestellung prüfen'; }
  }

  // Wire up events
  document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', (e) => { e.preventDefault(); addToCart(btn.dataset.product); });
  });
  if (cartButton) cartButton.addEventListener('click', openCart);
  if (cartClearBtn) cartClearBtn.addEventListener('click', clearCart);
  if (cartCheckoutBtn) cartCheckoutBtn.addEventListener('click', () => { closeCart(); openCheckout(); });
  if (checkoutForm) checkoutForm.addEventListener('submit', submitCheckout);
  if (applyCodeBtn) applyCodeBtn.addEventListener('click', applyDiscount);
  if (checkoutCode) checkoutCode.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); applyDiscount(); } });

  document.addEventListener('click', (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    if (t.closest('[data-close-cart]')) { e.preventDefault(); closeCart(); }
    if (t.closest('[data-close-checkout]')) { e.preventDefault(); closeCheckout(); }
    const rem = t.closest('[data-remove]');
    if (rem) { e.preventDefault(); removeFromCart(rem.getAttribute('data-remove')); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (checkoutModal && !checkoutModal.hidden) { closeCheckout(); return; }
    if (cartDrawer && !cartDrawer.hidden) { closeCart(); }
  });

  // Load products, then render. If it fails, hide cart UI gracefully.
  fetch('data/products.json')
    .then(r => r.ok ? r.json() : Promise.reject(new Error('products ' + r.status)))
    .then(json => {
      products = (json && json.products) || [];
      productMap = Object.fromEntries(products.map(p => [p.id, p]));
      renderCart();
      if (location.hash === '#checkout') { openCheckout(); }
    })
    .catch(() => { if (cartButton) cartButton.hidden = true; });
})();


/* ===================== Language switcher (DE/EN) ===================== */
(function languageSwitcher() {
  const KEY = 'zenith_lang_v1';
  const $ = (sel) => document.querySelector(sel);
  const all = (sel) => Array.from(document.querySelectorAll(sel));
  const translations = {
    de: { nav: ['Pakete','Mini-Pläne','Ablauf','Kontakt','Konto','Plan ansehen'], h1:'Dein Gym-Plan, den du wirklich durchziehst.', lead:'Klare Übungen, einfache Ernährung und ein Plan, der in deinen Alltag passt. Kein Rätselraten mehr, was du heute im Gym machen sollst.', cta1:'Plan ansehen', cta2:'TikTok ansehen', note:'Pläne ab €9 · faire Launch-Preise', chips:['Trainingsplan','Ernährung','Wochenstruktur','Cardio'], packagesEyebrow:'Coaching-Pakete', packagesTitle:'Wähle deinen Plan.', packagesText:'Faire Launch-Preise zum Start. Du zahlst wenig, bekommst aber einen klaren, umsetzbaren Plan. Die Buttons legen deine Auswahl direkt in den Warenkorb; der Checkout leitet zur sicheren Stripe-Zahlung weiter.', flowEyebrow:"So läuft's ab", flowTitle:'Kein Hype. Nur ein Plan, den du umsetzt.', flowText:'Du musst nichts recherchieren und nichts zusammenbasteln. Du holst dir den Plan und arbeitest ihn ab.', contactTitle:'Schreib mir.', contactText:'Du hast eine Frage zum Plan oder weißt nicht, welches Paket zu dir passt? Melde dich einfach — am schnellsten per E-Mail.', finalTitle:'Hör auf zu sammeln. Hol dir einen Plan und zieh ihn durch.', finalBtn:'Beliebten Plan in den Warenkorb', footerLegal:'Rechtliches & Kontakt', cart:'Warenkorb' },
    en: { nav: ['Packages','Mini plans','How it works','Contact','Account','View plans'], h1:'A gym plan you will actually follow.', lead:'Clear workouts, simple nutrition and a weekly structure that fits your life. No more guessing what to train today.', cta1:'View plans', cta2:'Watch TikTok', note:'Plans from €9 · fair launch prices', chips:['Training plan','Nutrition','Weekly structure','Cardio'], packagesEyebrow:'Coaching packages', packagesTitle:'Choose your plan.', packagesText:'Fair launch prices. You get a clear, actionable plan without overpaying. Buttons add your choice to the cart; checkout redirects to secure Stripe payment.', flowEyebrow:'How it works', flowTitle:'No hype. Just a plan you execute.', flowText:'No research, no guessing, no building your own routine. Get the plan and follow it.', contactTitle:'Message me.', contactText:'Have a question or not sure which package fits? Reach out — email is fastest.', finalTitle:'Stop collecting tips. Get a plan and follow it.', finalBtn:'Add popular plan to cart', footerLegal:'Legal & contact', cart:'Cart' }
  };
  const packageText = {
    de: [['Für den Einstieg','Starter Gym Plan','Ein kurzer Trainingsplan, mit dem du direkt loslegen kannst — ohne dich zu verzetteln.','In den Warenkorb'],['Training + Essen','Gym + Ernährung','Der Trainingsplan plus eine einfache Essensstruktur, damit du nicht nach einer Woche wieder rausfällst.','In den Warenkorb'],['Alles zusammen','Komplett-Paket','Training, Ernährung, Cardio, Schlaf und eine Wochenstruktur — alles an einem Ort, damit du nichts mehr selbst zusammensuchen musst.','In den Warenkorb']],
    en: [['Start here','Starter Gym Plan','A short training plan you can start immediately — without getting lost.','Add to cart'],['Training + food','Gym + Nutrition','The training plan plus a simple eating structure so you do not fall off after one week.','Add to cart'],['Everything together','Complete Bundle','Training, nutrition, cardio, sleep and weekly structure — all in one place.','Add to cart']]
  };
  function text(sel, val) { const el = $(sel); if (el) el.textContent = val; }
  function apply(lang) {
    const t = translations[lang] || translations.de;
    document.documentElement.lang = lang;
    localStorage.setItem(KEY, lang);
    const btn = document.getElementById('langToggle'); if (btn) btn.textContent = lang.toUpperCase();
    all('.nav-links a').slice(0, 6).forEach((a, i) => { if (t.nav[i]) a.textContent = t.nav[i]; });
    text('.hero h1', t.h1); text('.hero .lead', t.lead);
    const heroBtns = all('.hero-actions a'); if (heroBtns[0]) heroBtns[0].textContent = t.cta1; if (heroBtns[1]) heroBtns[1].textContent = t.cta2;
    text('.hero-note', t.note); all('.micro-proof span').forEach((el, i) => { if (t.chips[i]) el.textContent = t.chips[i]; });
    text('#pakete .eyebrow', t.packagesEyebrow); text('#pakete h2', t.packagesTitle); text('#pakete .section-head p', t.packagesText);
    all('.package-card').forEach((card, i) => { const p = packageText[lang][i]; if (!p) return; const label = card.querySelector('.package-label'); const h = card.querySelector('h3'); const desc = card.querySelector('p'); const b = card.querySelector('button'); if (label) label.textContent = p[0]; if (h) h.textContent = p[1]; if (desc) desc.textContent = p[2]; if (b) b.textContent = p[3]; });
    text('#ablauf .eyebrow', t.flowEyebrow); text('#ablauf h2', t.flowTitle); text('#ablauf .section-head p', t.flowText);
    text('#kontakt h2', t.contactTitle); text('#kontakt .contact-intro p', t.contactText);
    text('.final-cta h2', t.finalTitle); const finalBtn = document.querySelector('.final-cta .add-to-cart'); if (finalBtn) finalBtn.textContent = t.finalBtn;
    text('.footer-legal strong', t.footerLegal); const cartLabel = document.querySelector('.cart-label'); if (cartLabel) cartLabel.textContent = t.cart;
  }
  window.zenithSetLanguage = apply;
  document.addEventListener('DOMContentLoaded', () => {
    const saved = localStorage.getItem(KEY);
    const modal = document.getElementById('languageModal');
    apply(saved || 'de');
    if (!saved && modal) modal.hidden = false;
    const toggle = document.getElementById('langToggle');
    if (toggle) toggle.addEventListener('click', () => apply((localStorage.getItem(KEY) || 'de') === 'de' ? 'en' : 'de'));
    document.querySelectorAll('[data-lang-choice]').forEach(btn => btn.addEventListener('click', () => { apply(btn.getAttribute('data-lang-choice') || 'de'); if (modal) modal.hidden = true; }));
  });
})();
