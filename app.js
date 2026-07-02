let siteConfig = {
  brandName: 'ZENITH',
  tiktokHandle: '@tristymindagym',
  tiktokUrl: 'https://www.tiktok.com/@tristymindagym',
  contactEmail: 'synastyles@gmail.com'
};

// Aktive Sprache, von allen Modulen geteilt. localStorage kann blockiert sein (Privacy-Modus).
function zenithLang() {
  try { return localStorage.getItem('zenith_lang_v1') === 'en' ? 'en' : 'de'; } catch (e) { return 'de'; }
}

fetch('site-config.json').then(r => r.ok ? r.json() : null).then(cfg => {
  if (cfg) siteConfig = { ...siteConfig, ...cfg };
  applyConfig();
}).catch(applyConfig);

function applyConfig() {
  const tikTok = document.getElementById('tiktokLink');
  if (tikTok) tikTok.href = siteConfig.tiktokUrl; // Button-Text setzt der Sprachumschalter
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
    const en = zenithLang() === 'en';
    const subject = encodeURIComponent(en ? 'Question about ZENITH gym coaching' : 'Frage zum ZENITH Gym Coaching');
    const body = encodeURIComponent(en
      ? `Hi Tristan,\n\nI have a question about the coaching.\n\nMy email: ${email}\n\n`
      : `Hi Tristan,\n\nich habe eine Frage zum Coaching.\n\nMeine E-Mail: ${email}\n\n`);
    window.location.href = `mailto:${siteConfig.contactEmail}?subject=${subject}&body=${body}`;
    const status = document.getElementById('emailStatus');
    if (status) status.textContent = en
      ? 'Your email app opens with a prepared message to me.'
      : 'Deine E-Mail-App öffnet sich mit einer vorbereiteten Nachricht an mich.';
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
  const MSG = {
    de: {
      invalid: 'Bitte gib eine gültige E-Mail-Adresse ein.',
      wait: 'Einen Moment …',
      done: 'Eingetragen! Danke, dass du dabei bist.',
      already: 'Du bist schon auf der Liste — alles gut.',
      fail: 'Eintragen ist gerade nicht möglich (evtl. statische Vorschau). Schreib mir gern direkt per E-Mail.'
    },
    en: {
      invalid: 'Please enter a valid email address.',
      wait: 'One moment …',
      done: 'You are in! Thanks for joining.',
      already: 'You are already on the list — all good.',
      fail: 'Sign-up is not available right now (maybe a static preview). Feel free to email me directly.'
    }
  };
  const setStat = (msg, kind) => { if (status) { status.className = 'newsletter-status' + (kind ? ' ' + kind : ''); status.textContent = msg; } };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const t = MSG[zenithLang()];
    const email = input ? input.value.trim() : '';
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setStat(t.invalid, 'error'); if (input) input.focus(); return; }
    if (submit) submit.disabled = true;
    setStat(t.wait, null);
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
      // Server-Meldungen sind deutsch; im EN-Modus lokale Texte verwenden.
      const okMsg = zenithLang() === 'en' ? (data.already ? t.already : t.done) : (data.message || t.done);
      setStat(okMsg, 'ok');
      if (input) input.value = '';
    } else {
      const msg = zenithLang() === 'en' ? t.fail : ((data && data.message) ? data.message : t.fail);
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
  let checkoutMode = null; // 'demo' | 'live' | 'offline' | null(unknown)
  let appliedDiscount = null; // last validated discount summary from the server
  let lastMe = null; // letzter /api/me-Stand (für Sprachwechsel bei offenem Modal)

  // Alle dynamischen Warenkorb-/Checkout-Texte in beiden Sprachen.
  // Server-Meldungen (data.message) sind deutsch — im EN-Modus werden lokale Texte bevorzugt.
  const CART_T = {
    de: {
      cartOpenAria: (n) => n ? `Warenkorb öffnen (${n})` : 'Warenkorb öffnen',
      emptyTitle: 'Dein Warenkorb ist leer.',
      emptyBrowse: 'Stöbere durch die <a href="#pakete" data-close-cart>Pakete</a> oder <a href="#add-ons" data-close-cart>Mini-Pläne</a> und leg einen Plan rein.',
      typePackage: 'Paket', typeAddon: 'Mini-Plan', remove: 'Entfernen',
      added: (title) => `${title} wurde in den Warenkorb gelegt.`,
      removed: 'Artikel entfernt.', cleared: 'Warenkorb geleert.',
      cartEmptyErr: 'Dein Warenkorb ist leer.',
      codeChecking: 'Code wird geprüft …',
      codeNoCheck: 'Code konnte gerade nicht geprüft werden. Du kannst trotzdem fortfahren.',
      codeInvalid: 'Dieser Code ist ungültig.',
      codeActive: (d) => `Code ${d.code} aktiv: −${euro(d.discountCents)}. Neuer Gesamtbetrag ${euro(d.newTotalCents)} — genau so berechnet Stripe.`,
      codeNoted: (d) => `Code ${d.code} vorgemerkt${d.campaignName ? ' (' + d.campaignName + ')' : ''}. Der Rabatt von ${euro(d.discountCents)} ist noch nicht bei Stripe aktiviert — aktuell wird der reguläre Preis berechnet. Sobald der Code hinterlegt ist, greift er automatisch.`,
      legalLive: 'Ich verlange ausdrücklich, dass mit der Bereitstellung der digitalen Inhalte sofort nach der Zahlung begonnen wird. Mir ist bekannt, dass mein Widerrufsrecht mit Beginn der Bereitstellung erlischt.',
      legalDemo: 'Mir ist klar, dass dies ein Vorschau-/Demo-Modus ist und keine echte Zahlung ausgelöst wird.',
      payBtn: 'Sicher bezahlen', reviewBtn: 'Bestellung prüfen', waitBtn: 'Einen Moment …',
      liveNote: 'Du wirst zur sicheren Stripe-Bezahlseite weitergeleitet. Nach der Zahlung bekommst du einen persönlichen Zugangslink zu deinen Plänen.',
      liveNoteNoGoogle: ' Ein Google-Login ist dafür nicht nötig — der Konto-Login ist optional und derzeit nicht eingerichtet.',
      demoWhyOffline: 'Der Checkout-Server läuft hier nicht (statische Vorschau).',
      demoWhySetup: 'Der Zahlungsanbieter (Stripe) ist noch nicht hinterlegt.',
      demoNote: (why) => `Demo-Modus: ${why} Es wird <strong>keine Zahlung</strong> ausgelöst. Du kannst deine Auswahl als unverbindliche Bestellanfrage per E-Mail senden.`,
      invalidEmail: 'Bitte gib eine gültige E-Mail-Adresse ein.',
      confirmAll: 'Bitte bestätige alle Hinweise, um fortzufahren.',
      redirecting: 'Weiterleitung zur sicheren Bezahlseite …',
      noPayment: 'Es wurde keine Zahlung ausgelöst (Demo-/Setup-Modus).',
      mailOrderBtn: 'Bestellanfrage per E-Mail senden',
      mailSubject: 'ZENITH Bestellanfrage',
      mailBody: (lines, total, email) => `Hi Tristan,\n\nich möchte folgende Pläne bestellen:\n${lines}\n\nGesamt: ${total}\nMeine E-Mail: ${email}\n\n`
    },
    en: {
      cartOpenAria: (n) => n ? `Open cart (${n})` : 'Open cart',
      emptyTitle: 'Your cart is empty.',
      emptyBrowse: 'Browse the <a href="#pakete" data-close-cart>packages</a> or <a href="#add-ons" data-close-cart>mini plans</a> and add a plan.',
      typePackage: 'Package', typeAddon: 'Mini plan', remove: 'Remove',
      added: (title) => `${title} was added to your cart.`,
      removed: 'Item removed.', cleared: 'Cart emptied.',
      cartEmptyErr: 'Your cart is empty.',
      codeChecking: 'Checking code …',
      codeNoCheck: 'The code could not be checked right now. You can still continue.',
      codeInvalid: 'This code is not valid or cannot be used right now.',
      codeActive: (d) => `Code ${d.code} active: −${euro(d.discountCents)}. New total ${euro(d.newTotalCents)} — exactly what Stripe will charge.`,
      codeNoted: (d) => `Code ${d.code} noted${d.campaignName ? ' (' + d.campaignName + ')' : ''}. The ${euro(d.discountCents)} discount is not activated with Stripe yet — the regular price applies for now. Once the code is set up, it applies automatically.`,
      legalLive: 'I expressly request that the digital content is provided immediately after payment. I am aware that my right of withdrawal expires once provision begins.',
      legalDemo: 'I understand that this is a preview/demo mode and no real payment will be made.',
      payBtn: 'Pay securely', reviewBtn: 'Review order', waitBtn: 'One moment …',
      liveNote: 'You will be redirected to the secure Stripe payment page. After payment you get a personal access link to your plans.',
      liveNoteNoGoogle: ' A Google login is not required — the account login is optional and currently not set up.',
      demoWhyOffline: 'The checkout server is not running here (static preview).',
      demoWhySetup: 'The payment provider (Stripe) is not configured yet.',
      demoNote: (why) => `Demo mode: ${why} <strong>No payment</strong> will be made. You can send your selection as a non-binding order request by email.`,
      invalidEmail: 'Please enter a valid email address.',
      confirmAll: 'Please confirm all notices to continue.',
      redirecting: 'Redirecting to the secure payment page …',
      noPayment: 'No payment was made (demo/setup mode).',
      mailOrderBtn: 'Send order request by email',
      mailSubject: 'ZENITH order request',
      mailBody: (lines, total, email) => `Hi Tristan,\n\nI would like to order the following plans:\n${lines}\n\nTotal: ${total}\nMy email: ${email}\n\n`
    }
  };
  const tr = () => CART_T[zenithLang()];
  // Produkttitel: products.json liefert deutsche Titel (Stripe/Server brauchen sie),
  // optionales titleEn wird im EN-Modus bevorzugt.
  function pTitle(p) { return (zenithLang() === 'en' && p.titleEn) ? p.titleEn : p.title; }

  function euro(cents) {
    const v = cents / 100;
    if (Number.isInteger(v)) return `€${v}`;
    const s = v.toFixed(2);
    return `€${zenithLang() === 'en' ? s : s.replace('.', ',')}`;
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
    if (cartButton) cartButton.setAttribute('aria-label', tr().cartOpenAria(n));
  }

  function renderCart() {
    const ids = getCart();
    const t = tr();
    if (cartItemsEl) {
      if (!ids.length) {
        cartItemsEl.innerHTML = `<div class="cart-empty"><b>${t.emptyTitle}</b>${t.emptyBrowse}</div>`;
      } else {
        cartItemsEl.innerHTML = ids.map(id => {
          const p = productMap[id];
          const kind = p.type === 'package' ? t.typePackage : t.typeAddon;
          return `<div class="cart-item"><span class="ci-type">${kind}</span><h3>${escapeHtml(pTitle(p))}</h3><span class="ci-price">${euro(p.priceCents)}</span><button class="ci-remove" type="button" data-remove="${id}">${t.remove}</button></div>`;
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
    announce(tr().added(pTitle(productMap[id])));
    openCart();
  }
  function removeFromCart(id) {
    saveCart(getCart().filter(x => x !== id));
    renderCart();
    announce(tr().removed);
  }
  function clearCart() { saveCart([]); renderCart(); announce(tr().cleared); }

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
    const t = tr();
    const code = checkoutCode.value.trim();
    if (!code) { appliedDiscount = null; setDiscountStatus('', null); updateCheckoutTotal(); return; }
    const ids = getCart();
    if (!ids.length) { setDiscountStatus(t.cartEmptyErr, 'error'); return; }
    if (applyCodeBtn) applyCodeBtn.disabled = true;
    setDiscountStatus(t.codeChecking, null);
    let data = null;
    try {
      const res = await fetch('/api/discount/validate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: ids, code })
      });
      data = await res.json().catch(() => null);
    } catch (e) { data = null; }
    if (applyCodeBtn) applyCodeBtn.disabled = false;
    if (!data) { appliedDiscount = null; updateCheckoutTotal(); setDiscountStatus(t.codeNoCheck, 'info'); return; }
    if (!data.ok) {
      appliedDiscount = null; updateCheckoutTotal();
      // Server-Meldungen sind deutsch — im EN-Modus lokale Meldung.
      const msg = zenithLang() === 'en' ? t.codeInvalid : (data.message || 'Dieser Code ist ungültig.');
      setDiscountStatus(msg, 'error'); return;
    }
    appliedDiscount = data;
    updateCheckoutTotal();
    if (data.stripeApplied) {
      setDiscountStatus(t.codeActive(data), 'ok');
    } else {
      setDiscountStatus(t.codeNoted(data), 'info');
    }
  }

  function setStatus(text, kind) {
    if (!checkoutStatus) return;
    checkoutStatus.className = 'checkout-status' + (kind ? ' ' + kind : '');
    checkoutStatus.innerHTML = text;
  }

  function mailtoOrder() {
    const t = tr();
    const ids = getCart();
    const lines = ids.map(id => `- ${pTitle(productMap[id])} (${productMap[id].priceLabel})`).join('\n');
    const total = euro(cartTotalCents());
    const email = ($('checkoutEmail') && $('checkoutEmail').value.trim()) || '';
    const subject = encodeURIComponent(t.mailSubject);
    const body = encodeURIComponent(t.mailBody(lines, total, email));
    return `mailto:${siteConfig.contactEmail}?subject=${subject}&body=${body}`;
  }

  // Modus- und sprachabhängige Modal-Texte; auch beim Sprachwechsel bei offenem Modal.
  function renderModeTexts() {
    const t = tr();
    if (checkoutMode === 'live') {
      if (legalTermsText) legalTermsText.textContent = t.legalLive;
      if (checkoutSubmit) checkoutSubmit.textContent = t.payBtn;
      let liveNote = t.liveNote;
      if (lastMe && lastMe.googleConfigured === false) liveNote += t.liveNoteNoGoogle;
      setStatus(liveNote, null);
    } else {
      if (legalTermsText) legalTermsText.textContent = t.legalDemo;
      if (checkoutSubmit) checkoutSubmit.textContent = t.reviewBtn;
      const why = checkoutMode === 'offline' ? t.demoWhyOffline : t.demoWhySetup;
      setStatus(`<span class="checkout-note">${t.demoNote(why)}</span>`, 'demo');
    }
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
    lastMe = me;
    checkoutMode = me ? (me.checkoutMode === 'live' ? 'live' : 'demo') : 'offline';
    if (me && me.loggedIn && me.user && emailInput) { emailInput.value = me.user.email; }
    renderModeTexts();
  }
  function closeCheckout() {
    if (!checkoutModal) return;
    checkoutModal.hidden = true;
    if (cartDrawer && cartDrawer.hidden) lockScroll(false);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  async function submitCheckout(event) {
    event.preventDefault();
    const t = tr();
    const emailInput = $('checkoutEmail');
    const legalContent = $('legalContent');
    const legalAccept = $('legalAccept');
    const legalTerms = $('legalTerms');
    const email = emailInput ? emailInput.value.trim() : '';
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setStatus(t.invalidEmail, 'error'); if (emailInput) emailInput.focus(); return; }
    if (!legalContent || !legalContent.checked || !legalAccept || !legalAccept.checked || !legalTerms || !legalTerms.checked) { setStatus(t.confirmAll, 'error'); return; }
    const ids = getCart();
    if (!ids.length) { setStatus(t.cartEmptyErr, 'error'); return; }

    if (checkoutSubmit) { checkoutSubmit.disabled = true; checkoutSubmit.textContent = t.waitBtn; }
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
        setStatus(t.redirecting, null);
        window.location.href = data.url;
        return;
      }
    } catch (e) { data = null; }

    // Demo / offline / setup: never claim a payment happened.
    // Server-Meldungen sind deutsch — im EN-Modus lokale Meldung.
    const link = mailtoOrder();
    const msg = (zenithLang() === 'de' && data && data.message) ? data.message : t.noPayment;
    setStatus(`<span class="checkout-note">${escapeHtml(msg)} <br><a class="button ghost full" style="margin-top:10px" href="${link}">${t.mailOrderBtn}</a></span>`, 'demo');
    if (checkoutSubmit) { checkoutSubmit.disabled = false; checkoutSubmit.textContent = checkoutMode === 'live' ? t.payBtn : t.reviewBtn; }
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
  // Geänderter Code ohne erneutes "Anwenden" darf keinen alten Rabatt anzeigen —
  // sonst würde ein anderer Betrag angezeigt als Stripe berechnet.
  if (checkoutCode) checkoutCode.addEventListener('input', () => {
    if (!appliedDiscount) return;
    appliedDiscount = null;
    setDiscountStatus('', null);
    updateCheckoutTotal();
  });

  document.addEventListener('click', (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    const closer = t.closest('[data-close-cart]');
    if (closer) {
      // Anker-Links im Empty-State (#pakete/#add-ons) sollen nach dem Schließen
      // normal zur Sektion springen — preventDefault nur für Nicht-Anker.
      const href = closer.getAttribute('href');
      if (!(href && href.startsWith('#'))) e.preventDefault();
      closeCart();
    }
    if (t.closest('[data-close-checkout]')) { e.preventDefault(); closeCheckout(); }
    const rem = t.closest('[data-remove]');
    if (rem) { e.preventDefault(); removeFromCart(rem.getAttribute('data-remove')); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (checkoutModal && !checkoutModal.hidden) { closeCheckout(); return; }
    if (cartDrawer && !cartDrawer.hidden) { closeCart(); }
  });

  // Sprachwechsel: dynamische Cart-/Checkout-Inhalte neu rendern.
  document.addEventListener('zenith:langchange', () => {
    renderCart();
    if (checkoutModal && !checkoutModal.hidden) {
      renderCheckoutSummary();
      if (checkoutMode) renderModeTexts();
    }
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
    de: { nav: ['Pakete','Mini-Pläne','Ablauf','Kontakt','Konto','Plan ansehen'], h1:'Dein Gym-Plan, den du wirklich durchziehst.', lead:'Klare Übungen, einfache Ernährung und ein Plan, der in deinen Alltag passt. Kein Rätselraten mehr, was du heute im Gym machen sollst.', cta1:'Plan ansehen', cta2:'TikTok ansehen', note:'Pläne ab €9 · faire Launch-Preise', chips:['Trainingsplan','Ernährung','Wochenstruktur','Cardio'], packagesEyebrow:'Coaching-Pakete', packagesTitle:'Wähle deinen Plan.', packagesText:'Faire Launch-Preise zum Start. Du zahlst wenig, bekommst aber einen klaren, umsetzbaren Plan. Die Buttons legen deine Auswahl direkt in den Warenkorb; der Checkout leitet zur sicheren Stripe-Zahlung weiter.', flowEyebrow:"So läuft's ab", flowTitle:'Kein Hype. Nur ein Plan, den du umsetzt.', flowText:'Du musst nichts recherchieren und nichts zusammenbasteln. Du holst dir den Plan und arbeitest ihn ab.', contactTitle:'Schreib mir.', contactText:'Du hast eine Frage zum Plan oder weißt nicht, welches Paket zu dir passt? Melde dich einfach — am schnellsten per E-Mail.', finalTitle:'Hör auf zu sammeln. Hol dir einen Plan und zieh ihn durch.', finalBtn:'Beliebten Plan in den Warenkorb', footerLegal:'Rechtliches & Kontakt', cart:'Warenkorb',
      launchHtml:'<span class="launch-badge">Launch</span> Hast du einen Rabatt- oder Creator-Code? Löse ihn direkt im Checkout ein.',
      heroChipPlan:['Heute · Oberkörper','4 Übungen · ca. 45 Min'], heroChipPrice:'ab €9', ribbon:'Beliebt',
      valueStrip:[['Klarer Plan','Übungen, Sätze und Wiederholungen — du weißt jeden Tag, was ansteht.'],['Einfache Ernährung','Eine Essensstruktur und Einkaufslogik, die im Alltag funktioniert.'],['Wochenstruktur','Training, Cardio und Erholung sinnvoll über die Woche verteilt.']],
      addonsEyebrow:'Einzelne Mini-Pläne', addonsTitle:'Kleine Pläne. Fairer Preis. Sofort nutzbar.', addonsText:'Günstige Einzelteile für alle, die erst einmal mit einer Sache anfangen wollen.', addonAdd:'In den Warenkorb',
      addonCards:[['Essensplan','3 einfache Tagesstrukturen'],['Supplement-Guide','Was Sinn macht — und was nicht'],['Cardio Plan','Cardio ohne planloses Rennen'],['Schlaf & Erholung','Besser regenerieren'],['Technik-Checkliste','Saubere Ausführung im Gym']],
      trust:[['Sichere Zahlung','Bezahlung läuft verschlüsselt über Stripe. Deine Kartendaten sehen wir nie.'],['Sofort verfügbar','Direkt nach der Zahlung bekommst du deinen persönlichen Zugangslink.'],['Persönlicher Zugang','Deine Pläne liegen unter einem eigenen Link — online lesen oder als PDF laden.'],['Kein Abo','Einmal zahlen, dauerhaft behalten. Keine versteckten Kosten, keine Verlängerung.']],
      roadmapEyebrow:'In Arbeit', roadmapTitle:'Bald bei ZENITH.', roadmapText:'Diese Pläne sind in Vorbereitung. Trag dich in den Newsletter ein, dann sagen wir dir Bescheid, sobald sie live sind — oft zuerst mit einem Launch-Rabatt.',
      roadmapCards:[['Geplant','7-Day Gym Reset','Eine Woche klare Struktur zum Wiedereinstieg — Tag für Tag.'],['Geplant','30-Day Challenge','Ein Monat mit festem Fahrplan, Check-ins und Progression.'],['Geplant','Home-Workout Plan','Training ohne Geräte für zuhause oder unterwegs.'],['Geplant','Meal-Prep Cheatsheet','Vorkochen ohne Stress: Baukasten statt starrer Rezepte.'],['Geplant','Bulk / Cut Starter','Auf- oder Abbau sauber aufgesetzt, mit realistischer Kalorienlogik.'],['Idee','Video-Analyse Light','Schick ein kurzes Übungsvideo, bekomm konkretes Technik-Feedback.']],
      faqEyebrow:'Häufige Fragen', faqTitle:'Kurz erklärt.', faqText:'Alles, was du vor dem Kauf wissen willst. Noch eine Frage offen? Schreib mir einfach.',
      faq:[['Wie bekomme ich meinen Plan nach dem Kauf?','Direkt nach der Zahlung über Stripe erhältst du einen persönlichen Zugangslink. Darüber liest du deinen Plan online oder lädst ihn als PDF herunter. Wenn du eine E-Mail hinterlegst, schicken wir dir den Link zusätzlich zu.'],['Brauche ich ein Konto oder einen Google-Login?','Nein. Der Kauf läuft über den Stripe-Checkout und einen persönlichen Zugangslink. Ein Konto-Login ist optional und nur dafür da, deine Käufe gebündelt an einem Ort zu sehen.'],['Wie funktionieren Rabatt- und Creator-Codes?','Du gibst deinen Code im Checkout ein. Ist ein passender Rabatt bei Stripe aktiv, wird er direkt vom Preis abgezogen — du zahlst nie mehr und nie weniger, als dir angezeigt wird. Ist ein Code noch nicht bei Stripe hinterlegt, gilt der reguläre Preis, und wir behalten den Code für dich im Blick.'],['Ist das ein Abo?','Nein. Du zahlst einmal und behältst deinen Plan dauerhaft. Keine automatische Verlängerung, keine versteckten Kosten.'],['Für wen sind die Pläne gedacht?','Für Einsteiger und Wiedereinsteiger, die eine klare Struktur wollen statt sich alles selbst zusammenzusuchen. Die Inhalte sind allgemeine Fitness- und Trainingsinformationen und ersetzen keine medizinische Beratung.'],['Kann ich mein Geld zurückbekommen?','Es handelt sich um digitale Inhalte, die sofort bereitgestellt werden. Die Details zum Widerruf findest du in der <a href="widerruf.html">Widerrufsbelehrung</a>. Bei Problemen melde dich einfach — wir finden eine faire Lösung.']],
      nlEyebrow:'Newsletter', nlTitle:'Trainings-Tipps & Launch-Angebote.', nlText:'Ein kurzer Impuls ab und zu: umsetzbare Tipps, neue Pläne und Rabattcodes zuerst. Kein Spam, jederzeit abbestellbar.', nlSubmit:'Eintragen', nlPlaceholder:'deine@email.de', nlInterest:['Interesse (optional)','Training','Ernährung','Komplett-Paket','Nur Angebote'],
      nlConsent:'Mit dem Eintragen stimmst du zu, gelegentlich E-Mails von ZENITH zu erhalten.',
      steps:[['Plan holen','Wähle das Paket, das zu deinem Ziel passt — vom Starter bis zum Komplett-Paket.'],['Loslegen','Klare Übungen, Sätze und Wiederholungen. Du weißt jeden Tag, was im Gym ansteht.'],['Dranbleiben','Einfache Ernährung und eine Wochenstruktur, die in deinen Alltag passt.'],['Fragen?','Schreib mir per E-Mail oder auf TikTok. Ich helfe dir weiter.']],
      contactEyebrow:'Kontakt', contactFormLabel:'Frage stellen', contactFormBtn:'Nachricht vorbereiten', contactFormHint:'Öffnet deine E-Mail-App mit einer vorbereiteten Nachricht an mich.',
      finalEyebrow:'Leg los', finalBtn2:'Erst TikTok ansehen',
      medicalNote:'Hinweis: Die Inhalte sind allgemeine Fitness- und Trainingsinformationen und ersetzen keine medizinische Beratung. Bei Erkrankungen, Verletzungen oder Unsicherheit bitte ärztlich abklären.',
      footerResponsibleHtml:'Verantwortlich: Tristan · Kontakt: <a href="mailto:synastyles@gmail.com">synastyles@gmail.com</a>',
      footerNote:'Hinweis: Die Inhalte sind allgemeine Fitness- und Trainingsinformationen und ersetzen keine medizinische Beratung. Bei Fragen erreichst du uns über synastyles@gmail.com.',
      legalLinks:['Impressum','Datenschutz','AGB','Widerruf'],
      cartEyebrow:'Warenkorb', cartTitle:'Deine Auswahl', totalLabel:'Gesamt', cartCheckoutBtn:'Zum Checkout', cartClearBtn:'Warenkorb leeren',
      checkoutTitle:'Bestellung abschließen', codeLabelHtml:'Rabatt- oder Creator-Code <span>(optional)</span>', codePlaceholder:'Dein Code', applyBtn:'Anwenden', emailLabel:'E-Mail für die Lieferung', checkoutSubmitInitial:'Weiter',
      legalContentHtml:'Ich verstehe, dass es sich um digitale Inhalte mit allgemeinen Fitness- und Trainingsinformationen handelt — keine medizinische Beratung und keine garantierten Ergebnisse.',
      legalAcceptHtml:'Ich habe die <a href="agb.html" target="_blank" rel="noopener">AGB</a>, die <a href="datenschutz.html" target="_blank" rel="noopener">Datenschutzerklärung</a> und die <a href="widerruf.html" target="_blank" rel="noopener">Widerrufsbelehrung</a> gelesen und akzeptiere sie.',
      skipLink:'Zum Inhalt springen',
      heroAlt:'ZENITH — eine Langhantel unter dem goldenen ZENITH-Schriftzug, dunkel und cinematisch',
      metaTitle:'ZENITH — Gym Coaching mit Tristan',
      metaDescription:'Klare Trainingspläne, einfache Ernährung und eine Wochenstruktur, die in deinen Alltag passt. Gym-Coaching von Tristan unter der Marke ZENITH.',
      aria:{ nav:'Hauptnavigation', home:'ZENITH Startseite', langToggle:'Sprache wechseln', navToggle:'Navigation öffnen', microProof:'Inhalte', trust:'Warum ZENITH', interest:'Woran hast du Interesse?', closeCart:'Warenkorb schließen', close:'Schließen', closeLang:'Sprachauswahl schließen', nlEmail:'E-Mail-Adresse', nlInterest:'Interesse' } },
    en: { nav: ['Packages','Mini plans','How it works','Contact','Account','View plans'], h1:'A gym plan you will actually follow.', lead:'Clear workouts, simple nutrition and a weekly structure that fits your life. No more guessing what to train today.', cta1:'View plans', cta2:'Watch TikTok', note:'Plans from €9 · fair launch prices', chips:['Training plan','Nutrition','Weekly structure','Cardio'], packagesEyebrow:'Coaching packages', packagesTitle:'Choose your plan.', packagesText:'Fair launch prices. You get a clear, actionable plan without overpaying. Buttons add your choice to the cart; checkout redirects to secure Stripe payment.', flowEyebrow:'How it works', flowTitle:'No hype. Just a plan you execute.', flowText:'No research, no guessing, no building your own routine. Get the plan and follow it.', contactTitle:'Message me.', contactText:'Have a question or not sure which package fits? Reach out — email is fastest.', finalTitle:'Stop collecting tips. Get a plan and follow it.', finalBtn:'Add popular plan to cart', footerLegal:'Legal & contact', cart:'Cart',
      launchHtml:'<span class="launch-badge">Launch</span> Got a discount or creator code? Redeem it right in the checkout.',
      heroChipPlan:['Today · Upper body','4 exercises · about 45 min'], heroChipPrice:'from €9', ribbon:'Popular',
      valueStrip:[['Clear plan','Exercises, sets and reps — you know what to do every single day.'],['Simple nutrition','An eating structure and shopping logic that works in everyday life.'],['Weekly structure','Training, cardio and recovery spread sensibly across your week.']],
      addonsEyebrow:'Individual mini plans', addonsTitle:'Small plans. Fair prices. Ready to use.', addonsText:'Affordable single pieces for anyone who wants to start with one thing first.', addonAdd:'Add to cart',
      addonCards:[['Meal plan','3 simple daily structures'],['Supplement guide','What makes sense — and what does not'],['Cardio plan','Cardio without aimless running'],['Sleep & recovery','Recover better'],['Form checklist','Clean technique in the gym']],
      trust:[['Secure payment','Payment is encrypted through Stripe. We never see your card details.'],['Instant access','Right after payment you get your personal access link.'],['Personal access','Your plans live under your own link — read online or download as PDF.'],['No subscription','Pay once, keep it for good. No hidden fees, no renewals.']],
      roadmapEyebrow:'In progress', roadmapTitle:'Coming soon to ZENITH.', roadmapText:'These plans are in the works. Join the newsletter and we will let you know the moment they go live — often with a launch discount first.',
      roadmapCards:[['Planned','7-Day Gym Reset','One week of clear structure to get back on track — day by day.'],['Planned','30-Day Challenge','A month with a fixed roadmap, check-ins and progression.'],['Planned','Home-Workout Plan','Training with no equipment, at home or on the go.'],['Planned','Meal-Prep Cheatsheet','Batch cooking without stress: a toolkit instead of rigid recipes.'],['Planned','Bulk / Cut Starter','Bulking or cutting set up cleanly, with realistic calorie logic.'],['Idea','Video Analysis Light','Send a short exercise clip, get concrete form feedback.']],
      faqEyebrow:'Frequently asked', faqTitle:'Quick answers.', faqText:'Everything you want to know before buying. Still have a question? Just message me.',
      faq:[['How do I get my plan after buying?','Right after paying through Stripe you receive a personal access link. Use it to read your plan online or download it as a PDF. If you leave an email, we send you the link as well.'],['Do I need an account or a Google login?','No. The purchase runs through Stripe checkout and a personal access link. An account login is optional and only there to see all your purchases in one place.'],['How do discount and creator codes work?','You enter your code in the checkout. If a matching discount is active in Stripe, it is deducted from the price directly — you never pay more or less than what you see. If a code is not yet set up in Stripe, the regular price applies and we keep an eye on the code for you.'],['Is this a subscription?','No. You pay once and keep your plan for good. No automatic renewal, no hidden costs.'],['Who are the plans for?','For beginners and returners who want clear structure instead of piecing it together themselves. The content is general fitness and training information and does not replace medical advice.'],['Can I get a refund?','This is digital content that is provided immediately. Details on withdrawal are in the <a href="widerruf.html">cancellation policy</a>. If anything goes wrong, just reach out — we will find a fair solution.']],
      nlEyebrow:'Newsletter', nlTitle:'Training tips & launch offers.', nlText:'A short nudge now and then: actionable tips, new plans and discount codes first. No spam, unsubscribe anytime.', nlSubmit:'Sign up', nlPlaceholder:'you@email.com', nlInterest:['Interest (optional)','Training','Nutrition','Complete Bundle','Offers only'],
      nlConsent:'By signing up you agree to receive occasional emails from ZENITH.',
      steps:[['Get the plan','Pick the package that fits your goal — from Starter to the Complete Bundle.'],['Start','Clear exercises, sets and reps. You know exactly what to do in the gym every day.'],['Stay on track','Simple nutrition and a weekly structure that fits your life.'],['Questions?','Message me by email or on TikTok. I will help you out.']],
      contactEyebrow:'Contact', contactFormLabel:'Ask a question', contactFormBtn:'Prepare message', contactFormHint:'Opens your email app with a prepared message to me.',
      finalEyebrow:'Get started', finalBtn2:'Watch TikTok first',
      medicalNote:'Note: The content is general fitness and training information and does not replace medical advice. If you have a medical condition, an injury or any doubts, please check with a doctor first.',
      footerResponsibleHtml:'Responsible: Tristan · Contact: <a href="mailto:synastyles@gmail.com">synastyles@gmail.com</a>',
      footerNote:'Note: The content is general fitness and training information and does not replace medical advice. Questions? Reach us at synastyles@gmail.com.',
      legalLinks:['Legal notice','Privacy','Terms','Cancellation'],
      cartEyebrow:'Cart', cartTitle:'Your selection', totalLabel:'Total', cartCheckoutBtn:'Go to checkout', cartClearBtn:'Empty cart',
      checkoutTitle:'Complete your order', codeLabelHtml:'Discount or creator code <span>(optional)</span>', codePlaceholder:'Your code', applyBtn:'Apply', emailLabel:'Email for delivery', checkoutSubmitInitial:'Continue',
      legalContentHtml:'I understand that these are digital products with general fitness and training information — not medical advice, and results are not guaranteed.',
      legalAcceptHtml:'I have read and accept the <a href="agb.html" target="_blank" rel="noopener">Terms (AGB)</a>, the <a href="datenschutz.html" target="_blank" rel="noopener">Privacy Policy</a> and the <a href="widerruf.html" target="_blank" rel="noopener">Cancellation Policy</a>.',
      skipLink:'Skip to content',
      heroAlt:'ZENITH — a barbell under the golden ZENITH lettering, dark and cinematic',
      metaTitle:'ZENITH — Gym coaching with Tristan',
      metaDescription:'Clear training plans, simple nutrition and a weekly structure that fits your life. Gym coaching by Tristan under the ZENITH brand.',
      aria:{ nav:'Main navigation', home:'ZENITH home', langToggle:'Switch language', navToggle:'Open navigation', microProof:'Contents', trust:'Why ZENITH', interest:'What are you interested in?', closeCart:'Close cart', close:'Close', closeLang:'Close language selection', nlEmail:'Email address', nlInterest:'Interest' } }
  };
  const packageText = {
    de: [['Für den Einstieg','Starter Gym Plan','Ein kurzer Trainingsplan, mit dem du direkt loslegen kannst — ohne dich zu verzetteln.','In den Warenkorb',['Trainingsplan für den Einstieg','Übungen, Sätze, Wiederholungen','Wann du steigern solltest','Typische Anfänger-Fehler vermeiden']],['Training + Essen','Gym + Ernährung','Der Trainingsplan plus eine einfache Essensstruktur, damit du nicht nach einer Woche wieder rausfällst.','In den Warenkorb',['Alles aus dem Starter Gym Plan','Einfache Essensstruktur für den Alltag','Einkaufslogik: was wirklich in den Korb','Protein und Portionen ohne Kalorien-Stress']],['Alles zusammen','Komplett-Paket','Training, Ernährung, Cardio, Schlaf und eine Wochenstruktur — alles an einem Ort, damit du nichts mehr selbst zusammensuchen musst.','In den Warenkorb',['Alles aus den Plänen 1 und 2','Cardio sinnvoll einbauen','Schlaf und Erholung','Supplement-Basics: was sinnvoll ist','Feste Wochenstruktur']]],
    en: [['Start here','Starter Gym Plan','A short training plan you can start immediately — without getting lost.','Add to cart',['A training plan to get you started','Exercises, sets, reps','When to add weight','Avoid typical beginner mistakes']],['Training + food','Gym + Nutrition','The training plan plus a simple eating structure so you do not fall off after one week.','Add to cart',['Everything from the Starter Gym Plan','A simple eating structure for everyday life','Shopping logic: what really belongs in your basket','Protein and portions without calorie stress']],['Everything together','Complete Bundle','Training, nutrition, cardio, sleep and weekly structure — all in one place.','Add to cart',['Everything from plans 1 and 2','How to add cardio sensibly','Sleep and recovery','Supplement basics: what makes sense','A fixed weekly structure']]]
  };
  function text(sel, val) { const el = $(sel); if (el) el.textContent = val; }
  function html(sel, val) { const el = $(sel); if (el) el.innerHTML = val; }
  function readLang() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function writeLang(lang) { try { localStorage.setItem(KEY, lang); } catch (e) { /* storage may be blocked */ } }
  function apply(lang) {
    const t = translations[lang] || translations.de;
    document.documentElement.lang = lang;
    writeLang(lang);
    const btn = document.getElementById('langToggle'); if (btn) btn.textContent = lang.toUpperCase();
    all('.nav-links a').slice(0, 6).forEach((a, i) => { if (t.nav[i]) a.textContent = t.nav[i]; });
    text('.hero h1', t.h1); text('.hero .lead', t.lead);
    const heroBtns = all('.hero-actions a'); if (heroBtns[0]) heroBtns[0].textContent = t.cta1; if (heroBtns[1]) heroBtns[1].textContent = t.cta2;
    text('.hero-note', t.note); all('.micro-proof span').forEach((el, i) => { if (t.chips[i]) el.textContent = t.chips[i]; });
    if (t.heroChipPlan) { const chip = $('.hero-chip.plan'); if (chip) { const b = chip.querySelector('b'); const s = chip.querySelector('span'); if (b) b.textContent = t.heroChipPlan[0]; if (s) s.textContent = t.heroChipPlan[1]; } }
    if (t.heroChipPrice) text('.hero-chip.price', t.heroChipPrice);
    if (t.valueStrip) all('.value-strip > div').forEach((item, i) => { const v = t.valueStrip[i]; if (!v) return; const s = item.querySelector('span'); const b = item.querySelector('strong'); if (s) s.textContent = v[0]; if (b) b.textContent = v[1]; });
    text('#pakete .eyebrow', t.packagesEyebrow); text('#pakete h2', t.packagesTitle); text('#pakete .section-head p', t.packagesText);
    all('.package-card').forEach((card, i) => { const p = packageText[lang][i]; if (!p) return; const label = card.querySelector('.package-label'); const h = card.querySelector('h3'); const desc = card.querySelector('p'); const b = card.querySelector('button'); if (label) label.textContent = p[0]; if (h) h.textContent = p[1]; if (desc) desc.textContent = p[2]; if (b) b.textContent = p[3]; card.querySelectorAll('ul li').forEach((li, j) => { if (p[4] && p[4][j]) li.textContent = p[4][j]; }); });
    if (t.ribbon) text('.package-card .ribbon', t.ribbon);
    text('#add-ons .eyebrow', t.addonsEyebrow); text('#add-ons h2', t.addonsTitle); text('#add-ons .section-head p', t.addonsText);
    if (t.addonCards) all('#add-ons .addon-card').forEach((card, i) => { const c = t.addonCards[i]; if (!c) return; const s = card.querySelector('span'); const sm = card.querySelector('small'); const em = card.querySelector('.addon-add'); if (s) s.textContent = c[0]; if (sm) sm.textContent = c[1]; if (em && t.addonAdd) em.textContent = t.addonAdd; });
    text('#ablauf .eyebrow', t.flowEyebrow); text('#ablauf h2', t.flowTitle); text('#ablauf .section-head p', t.flowText);
    text('#kontakt h2', t.contactTitle); text('#kontakt .contact-intro p', t.contactText);
    text('.final-cta h2', t.finalTitle); const finalBtn = document.querySelector('.final-cta .add-to-cart'); if (finalBtn) finalBtn.textContent = t.finalBtn;
    text('.footer-legal strong', t.footerLegal); const cartLabel = document.querySelector('.cart-label'); if (cartLabel) cartLabel.textContent = t.cart;
    // Launch hint (keeps the badge), trust strip, roadmap, FAQ and newsletter — added sections.
    if (t.launchHtml) html('#launchHint', t.launchHtml);
    if (t.trust) all('.trust-strip .trust-item').forEach((item, i) => { const tr = t.trust[i]; if (!tr) return; const b = item.querySelector('b'); const s = item.querySelector('span'); if (b) b.textContent = tr[0]; if (s) s.textContent = tr[1]; });
    text('#roadmap .eyebrow', t.roadmapEyebrow); text('#roadmap h2', t.roadmapTitle); text('#roadmap .section-head p', t.roadmapText);
    if (t.roadmapCards) all('#roadmap .roadmap-card').forEach((card, i) => { const c = t.roadmapCards[i]; if (!c) return; const tag = card.querySelector('.roadmap-tag'); const h = card.querySelector('h3'); const p = card.querySelector('p'); if (tag) tag.textContent = c[0]; if (h) h.textContent = c[1]; if (p) p.textContent = c[2]; });
    text('#faq .eyebrow', t.faqEyebrow); text('#faq h2', t.faqTitle); text('#faq .section-head p', t.faqText);
    if (t.faq) all('#faq .faq-item').forEach((item, i) => { const f = t.faq[i]; if (!f) return; const sum = item.querySelector('summary'); const p = item.querySelector('p'); if (sum) sum.textContent = f[0]; if (p) p.innerHTML = f[1]; });
    text('#newsletter .eyebrow', t.nlEyebrow); text('#newsletter h2', t.nlTitle); text('#newsletter .newsletter-copy p', t.nlText);
    text('#newsletterSubmit', t.nlSubmit); const nlEmail = $('#newsletterEmail'); if (nlEmail && t.nlPlaceholder) nlEmail.placeholder = t.nlPlaceholder;
    if (t.nlInterest) all('#newsletterInterest option').forEach((opt, i) => { if (t.nlInterest[i]) opt.textContent = t.nlInterest[i]; });
    // Einwilligungszeile nur setzen, wenn dort keine dynamische Statusmeldung steht.
    const nlStatus = $('#newsletterStatus');
    if (nlStatus && !nlStatus.classList.contains('ok') && !nlStatus.classList.contains('error')) nlStatus.textContent = t.nlConsent;
    // Ablauf-Schritte
    if (t.steps) all('#ablauf .step-card').forEach((card, i) => { const s = t.steps[i]; if (!s) return; const h = card.querySelector('h3'); const sp = card.querySelector('span'); if (h) h.textContent = s[0]; if (sp) sp.textContent = s[1]; });
    // Kontakt-Sektion inkl. Formular und TikTok-Button
    text('#kontakt .eyebrow', t.contactEyebrow);
    text('#tiktokLink', t.cta2);
    text('label[for="emailInput"]', t.contactFormLabel);
    const cEmail = $('#emailInput'); if (cEmail) cEmail.placeholder = t.nlPlaceholder;
    const cBtn = $('#emailForm button[type="submit"]'); if (cBtn) cBtn.textContent = t.contactFormBtn;
    text('#emailStatus', t.contactFormHint);
    // Final-CTA
    text('.final-cta .eyebrow', t.finalEyebrow);
    text('.final-cta .button.ghost', t.finalBtn2);
    text('.final-cta .medical-note', t.medicalNote);
    // Footer
    all('.footer-links a').forEach((a, i) => { if (i < 5 && t.nav[i]) a.textContent = t.nav[i]; });
    html('.footer-legal > p', t.footerResponsibleHtml);
    text('.footer-legal .legal-note', t.footerNote);
    all('.footer-legal-links a').forEach((a, i) => { if (t.legalLinks[i]) a.textContent = t.legalLinks[i]; });
    // Warenkorb-Drawer (statische Texte; Inhalte rendert cartSystem sprachabhängig)
    text('.cart-head .eyebrow', t.cartEyebrow);
    text('#cartTitle', t.cartTitle);
    text('.cart-total span', t.totalLabel);
    text('#cartCheckout', t.cartCheckoutBtn);
    text('#cartClear', t.cartClearBtn);
    // Checkout-Modal (statische Texte)
    text('#checkoutTitle', t.checkoutTitle);
    html('label[for="checkoutCode"]', t.codeLabelHtml);
    const codeInput = $('#checkoutCode'); if (codeInput) codeInput.placeholder = t.codePlaceholder;
    text('#applyCode', t.applyBtn);
    text('.checkout-total span', t.totalLabel);
    text('label[for="checkoutEmail"]', t.emailLabel);
    const coEmail = $('#checkoutEmail'); if (coEmail) coEmail.placeholder = t.nlPlaceholder;
    const lc = $('#legalContent'); const lcSpan = lc && lc.closest('label') ? lc.closest('label').querySelector('span') : null; if (lcSpan) lcSpan.innerHTML = t.legalContentHtml;
    const la = $('#legalAccept'); const laSpan = la && la.closest('label') ? la.closest('label').querySelector('span') : null; if (laSpan) laSpan.innerHTML = t.legalAcceptHtml;
    // #legalTermsText + Submit-Label setzt cartSystem modusabhängig (Event unten);
    // Default für den Fall, dass das Modal noch nie geöffnet wurde:
    text('#checkoutSubmit', t.checkoutSubmitInitial);
    // Skip-Link, Alt-Text, Titel/Meta
    text('.skip-link', t.skipLink);
    const heroImg = $('.portal-card img'); if (heroImg && t.heroAlt) heroImg.setAttribute('alt', t.heroAlt);
    if (t.metaTitle) document.title = t.metaTitle;
    const metaDesc = $('meta[name="description"]'); if (metaDesc && t.metaDescription) metaDesc.setAttribute('content', t.metaDescription);
    // aria-Labels / sr-only-Texte
    if (t.aria) {
      [['nav.nav-shell', t.aria.nav], ['.brand', t.aria.home], ['#langToggle', t.aria.langToggle], ['.nav-toggle', t.aria.navToggle], ['.micro-proof', t.aria.microProof], ['.trust-strip', t.aria.trust], ['#newsletterInterest', t.aria.interest], ['.cart-backdrop', t.aria.closeCart], ['.language-backdrop', t.aria.closeLang]]
        .forEach(([sel, val]) => { const el = $(sel); if (el && val) el.setAttribute('aria-label', val); });
      all('.modal-close').forEach(el => el.setAttribute('aria-label', t.aria.close));
      text('label[for="newsletterEmail"]', t.aria.nlEmail);
      text('label[for="newsletterInterest"]', t.aria.nlInterest);
    }
    // Andere Module (cartSystem) neu rendern lassen.
    document.dispatchEvent(new CustomEvent('zenith:langchange', { detail: { lang } }));
  }
  window.zenithSetLanguage = apply;
  document.addEventListener('DOMContentLoaded', () => {
    const saved = readLang();
    const modal = document.getElementById('languageModal');
    apply(saved || 'de');
    if (!saved && modal) modal.hidden = false;
    const toggle = document.getElementById('langToggle');
    if (toggle) toggle.addEventListener('click', () => apply((readLang() || 'de') === 'de' ? 'en' : 'de'));
    document.querySelectorAll('[data-lang-choice]').forEach(btn => btn.addEventListener('click', () => { apply(btn.getAttribute('data-lang-choice') || 'de'); if (modal) modal.hidden = true; }));
  });
})();
