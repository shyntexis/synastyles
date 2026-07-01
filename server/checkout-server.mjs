// ZENITH server — static site + Stripe checkout + Google accounts + protected plan delivery.
// Zero external dependencies (Node 18+ for global fetch). No secrets ever reach the browser.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { readFileSync, existsSync } from 'node:fs';
import { join, normalize, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as store from './store.mjs';
import * as auth from './auth.mjs';
import * as stripe from './stripe.mjs';
import * as discounts from './discounts.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = normalize(join(__dirname, '..'));
const PRIVATE_PLANS = join(__dirname, 'private', 'plans');
const PRIVATE_PDFS = join(__dirname, 'private', 'pdfs');
const PORT = Number(process.env.PORT) || 5097;

// ---- tiny .env loader ----
(function loadEnv() {
  const p = join(ROOT, '.env');
  if (!existsSync(p)) return;
  try {
    for (const raw of readFileSync(p, 'utf8').split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq === -1) continue;
      const k = line.slice(0, eq).trim();
      let v = line.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (k && process.env[k] === undefined) process.env[k] = v;
    }
  } catch (e) { /* ignore */ }
})();

function defaultSiteUrl() {
  if (process.env.RENDER_EXTERNAL_HOSTNAME) return `https://${process.env.RENDER_EXTERNAL_HOSTNAME}`;
  if (process.env.RENDER_SERVICE_NAME) return `https://${process.env.RENDER_SERVICE_NAME}.onrender.com`;
  return `http://127.0.0.1:${PORT}`;
}

const SITE = (process.env.PUBLIC_SITE_URL || defaultSiteUrl()).replace(/\/$/, '');
const SECURE = SITE.startsWith('https://');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8', '.pdf': 'application/pdf'
};

function loadProducts() {
  try { return JSON.parse(readFileSync(join(ROOT, 'data', 'products.json'), 'utf8')); }
  catch (e) { return { products: [] }; }
}
function productMap() { return Object.fromEntries((loadProducts().products || []).map((p) => [p.id, p])); }
function stripePriceId(product) { return process.env[product.stripePriceEnvKey] || product.stripePriceId || ''; }
function euroLabel(c) { const v = c / 100; return Number.isInteger(v) ? `€${v}` : `€${v.toFixed(2).replace('.', ',')}`; }
function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Cache-Control': 'no-store', ...headers });
  res.end(body);
}
function sendJson(res, status, obj, headers = {}) {
  send(res, status, JSON.stringify(obj), { 'Content-Type': 'application/json; charset=utf-8', ...headers });
}
function redirect(res, location, cookie) {
  const h = { Location: location };
  if (cookie) h['Set-Cookie'] = cookie;
  res.writeHead(302, h);
  res.end();
}
async function readBody(req, limit = 1_000_000) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > limit) { reject(new Error('too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}
async function readJson(req) { try { return JSON.parse((await readBody(req)) || '{}'); } catch (e) { return {}; } }

const PAGE_HEAD = (title) => `<!doctype html><html lang="de"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><meta name="theme-color" content="#0a0a09"/><title>${esc(title)}</title><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet"/><link rel="stylesheet" href="/products/plans/plan.css"/>`;

function safeFilePart(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'plan'; }
function planPdfName(product) { return safeFilePart(product.slug || product.id || product.title) + '.pdf'; }
function planPdfPath(product) { return join(PRIVATE_PDFS, planPdfName(product)); }
function planPdfExists(product) { return !!product && existsSync(planPdfPath(product)); }
function accessPathFor(email, productId, sessionId) { return '/access/' + auth.makeDeliveryToken({ email, productId, sessionId }); }
function downloadPathForAccess(accessPath) { return accessPath + '/download.pdf'; }
function deliveryForProduct(product, email, sessionId) {
  const accessPath = accessPathFor(email, product.id, sessionId);
  return { id: product.id, title: product.title, accessPath, downloadPath: planPdfExists(product) ? downloadPathForAccess(accessPath) : null };
}
function mailConfigured() { return !!(process.env.RESEND_API_KEY && (process.env.MAIL_FROM || process.env.RESEND_FROM_EMAIL)); }
function planEmailHtml(email, products) {
  const rows = products.map((p) => `<li><strong>${esc(p.title)}</strong><br><a href="${SITE}${p.accessPath}">Online ansehen</a>${p.downloadPath ? ` · <a href="${SITE}${p.downloadPath}">PDF herunterladen</a>` : ''}</li>`).join('');
  return `<div style="font-family:Inter,Arial,sans-serif;line-height:1.55;color:#17140f"><h1>Deine ZENITH Pläne sind bereit.</h1><p>Danke für deinen Kauf. Du kannst deine Pläne online öffnen oder als PDF herunterladen.</p><ul>${rows}</ul><p style="color:#6b6254;font-size:13px">Zugriff für ${esc(email)}. Bitte teile die persönlichen Links nicht öffentlich.</p><p>Fragen? Antworte einfach auf diese E-Mail oder schreibe an synastyles@gmail.com.</p></div>`;
}
async function maybeSendPurchaseEmail({ sessionId, email, products }) {
  if (!mailConfigured() || !sessionId || !email || !products || !products.length) return { skipped: true, reason: 'mail not configured' };
  try {
    if (await store.hasPurchaseEmailSent(sessionId)) return { skipped: true, reason: 'already sent' };
    const byId = productMap();
    const attachments = products.map((p) => {
      const product = byId[p.id];
      if (!product || !planPdfExists(product)) return null;
      try { return { filename: planPdfName(product), content: readFileSync(planPdfPath(product)).toString('base64') }; }
      catch (e) { return null; }
    }).filter(Boolean);
    const payload = {
      from: process.env.MAIL_FROM || process.env.RESEND_FROM_EMAIL,
      to: [email],
      reply_to: process.env.MAIL_REPLY_TO || 'synastyles@gmail.com',
      subject: 'Deine ZENITH Gym-Pläne sind bereit',
      html: planEmailHtml(email, products),
      attachments
    };
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (r.ok) { await store.markPurchaseEmailSent(sessionId); return { sent: true }; }
    return { sent: false, status: r.status };
  } catch (e) { return { sent: false, error: 'mail failed' }; }
}


// Best-effort campaign/affiliate attribution from a completed session's metadata.
// Idempotent per session; never throws into the fulfillment path.
async function maybeRecordRedemption(session) {
  try {
    const md = (session && session.metadata) || {};
    const code = md.discount_code || '';
    if (!code) return;
    await store.recordDiscountRedemption(code, {
      sessionId: session.id, affiliateName: md.affiliate || '', source: md.discount_source || ''
    });
  } catch (e) { /* attribution is non-critical */ }
}

function lockedPage(res, status, title, msg) {
  const html = `${PAGE_HEAD(title)}<style>.lock{max-width:620px;margin:8vh auto;padding:0 22px;text-align:center}.lock .plan-z{margin:0 auto 18px}.lock .btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:24px}.lock a{padding:12px 20px;border-radius:999px;font-weight:800;text-decoration:none}.lock .p{color:#170f04;background:linear-gradient(135deg,#ffe9bd,#e7be6c 50%,#f0a23a)}.lock .g{border:1px solid rgba(255,255,255,.14);color:#f5eedf;background:rgba(255,255,255,.05)}</style></head><body><main class="lock"><span class="plan-z" aria-hidden="true">Z</span><h1>${esc(title)}</h1><p style="color:#b9b2a3;font-size:17px;margin-top:14px">${esc(msg)}</p><div class="btns"><a class="p" href="/account.html">Mein Konto</a><a class="g" href="/index.html">Zur Startseite</a></div></main></body></html>`;
  send(res, status, html, { 'Content-Type': 'text/html; charset=utf-8' });
}

function renderAccessPage(res, product, email, innerHtml, token) {
  const accessPath = '/access/' + encodeURIComponent(token);
  const pdfPath = planPdfExists(product) ? accessPath + '/download.pdf' : null;
  const html = `${PAGE_HEAD(product.title + ' — ZENITH')}<style>
    .access-bar{position:sticky;top:0;z-index:5;display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center;justify-content:space-between;max-width:980px;margin:0 auto;padding:14px clamp(18px,4vw,28px);border-bottom:1px solid rgba(255,255,255,.1);background:rgba(10,10,9,.88);backdrop-filter:blur(14px)}
    .access-bar .who{display:flex;align-items:center;gap:11px}.access-bar .who .plan-z{width:36px;height:36px}.access-bar .meta{display:grid;line-height:1.15}.access-bar .meta strong{letter-spacing:.18em;font-size:14px}.access-bar .meta em{font-style:normal;color:#bba76f;font-size:12px}
    .access-bar .links{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.access-bar .links a,.access-bar .links button{font:inherit;font-size:13px;font-weight:800;color:#f5eedf;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.13);border-radius:999px;padding:9px 14px;cursor:pointer;text-decoration:none}.access-bar .links a.primary{color:#170f04;background:linear-gradient(135deg,#ffe9bd,#e7be6c 50%,#f0a23a);border:0}.access-bar .links a:hover,.access-bar .links button:hover{filter:brightness(1.06)}
    .access-tag{display:inline-block;padding:6px 12px;border-radius:999px;border:1px solid rgba(231,190,108,.3);background:rgba(231,190,108,.1);color:#ffe2a0;font-size:12px;font-weight:700}
    .video-slot{margin:28px 0 0;padding:22px 24px;border:1px dashed rgba(231,190,108,.42);border-radius:18px;background:linear-gradient(135deg,rgba(231,190,108,.08),rgba(255,255,255,.025));color:#d9d1c0}.video-slot b{color:#ffe2a0}
  </style></head><body>
  <div class="access-bar">
    <div class="who"><span class="plan-z" aria-hidden="true">Z</span><div class="meta"><strong>ZENITH</strong><em>Dein Zugang</em></div></div>
    <div class="links"><span class="access-tag">Zugriff für ${esc(email)}</span><a href="${accessPath}">Online ansehen</a>${pdfPath ? `<a class="primary" href="${pdfPath}">PDF herunterladen</a>` : ''}<a href="/account.html">Mein Konto</a><button id="logoutBtn" type="button">Abmelden</button></div>
  </div>
  <main class="plan">
    ${innerHtml}
    <div class="video-slot"><b>🎬 Video-Lektion folgt hier.</b><br>Zu diesem Plan kommen kurze, editierte Coaching-Videos. Die PDF-Version kannst du oben herunterladen.</div>
  </main>
  <script>document.getElementById('logoutBtn').addEventListener('click',function(){fetch('/api/logout',{method:'POST'}).then(function(){location.href='/account.html'})});</script>
  </body></html>`;
  send(res, 200, html, { 'Content-Type': 'text/html; charset=utf-8' });
}

function extractPlanInner(slug) {
  try {
    const file = readFileSync(join(PRIVATE_PLANS, slug + '.html'), 'utf8');
    const start = file.indexOf('<main class="plan">');
    const end = file.lastIndexOf('</main>');
    if (start === -1 || end === -1) return null;
    return file.slice(start + '<main class="plan">'.length, end);
  } catch (e) { return null; }
}

// ---------------- API handlers ----------------
function statusPayload(req) {
  const products = loadProducts().products || [];
  const hasSecret = stripe.stripeConfigured();
  const missing = products.filter((p) => !stripePriceId(p)).map((p) => p.stripePriceEnvKey);
  const user = auth.readSession(req);
  return {
    mode: hasSecret && missing.length === 0 ? 'live' : 'demo',
    stripe: hasSecret,
    webhookConfigured: stripe.webhookConfigured(),
    accessTokens: 'signed-v2',
    mailConfigured: mailConfigured(),
    missingPriceEnvKeys: missing,
    googleConfigured: auth.googleConfigured(),
    devAuth: auth.devAuthEnabled(),
    loggedIn: !!user,
    email: user ? user.email : null,
    site: SITE
  };
}

// Validate an optional discount code against the chosen products. Returns a compact,
// client-safe summary (never leaks the resolved Stripe coupon id). Never throws.
async function evaluateDiscount(code, chosen) {
  if (!code || typeof code !== 'string' || !code.trim()) return null;
  try {
    const items = chosen.map((p) => ({ id: p.id, priceCents: p.priceCents }));
    const redemptions = await store.getDiscountRedemptionCount(discounts.normalizeCode(code));
    const dv = discounts.validateDiscount({ code, items, redemptions });
    return dv;
  } catch (e) { return { ok: false, reason: 'error', message: 'Code konnte nicht geprüft werden.' }; }
}
function publicDiscount(dv) {
  if (!dv) return null;
  if (!dv.ok) return { ok: false, code: dv.code || '', reason: dv.reason, message: dv.message };
  return {
    ok: true, code: dv.code, campaignName: dv.campaignName, percentOff: dv.percentOff,
    amountOffCents: dv.amountOffCents, subtotalCents: dv.subtotalCents, discountCents: dv.discountCents,
    newTotalCents: dv.newTotalCents, discountLabel: euroLabel(dv.discountCents),
    newTotalLabel: euroLabel(dv.newTotalCents), stripeApplied: dv.stripeApplied
  };
}

async function handleDiscountValidate(req, res) {
  const payload = await readJson(req);
  const byId = productMap();
  const ids = Array.isArray(payload.items) ? [...new Set(payload.items.filter((id) => byId[id]))] : [];
  const code = typeof payload.code === 'string' ? payload.code : '';
  if (!ids.length) return sendJson(res, 200, { ok: false, reason: 'empty_cart', message: 'Dein Warenkorb ist leer.' });
  const chosen = ids.map((id) => byId[id]);
  const dv = await evaluateDiscount(code, chosen);
  if (!dv) return sendJson(res, 200, { ok: false, reason: 'empty', message: 'Bitte gib einen Code ein.' });
  const live = stripe.stripeConfigured() && chosen.every((p) => stripePriceId(p));
  const pub = publicDiscount(dv);
  // In demo/offline the whole checkout is a mailto order — the preview is illustrative only.
  if (pub && pub.ok) pub.mode = live ? 'live' : 'demo';
  return sendJson(res, 200, pub);
}

async function handleCreateSession(req, res) {
  const payload = await readJson(req);
  const byId = productMap();
  const ids = Array.isArray(payload.items) ? [...new Set(payload.items.filter((id) => byId[id]))] : [];
  const user = auth.readSession(req);
  const email = (user && user.email) || (typeof payload.email === 'string' ? payload.email.trim() : '');
  if (!ids.length) return sendJson(res, 400, { error: 'empty cart' });

  const chosen = ids.map((id) => byId[id]);
  const totalCents = chosen.reduce((s, p) => s + p.priceCents, 0);
  const secret = process.env.STRIPE_SECRET_KEY;
  const priceIds = chosen.map((p) => stripePriceId(p));
  const missing = chosen.filter((p, i) => !priceIds[i]).map((p) => p.stripePriceEnvKey);

  // Optional discount code — validated server-side (authoritative).
  const dv = await evaluateDiscount(payload.code, chosen);

  if (!secret || missing.length) {
    return sendJson(res, 200, {
      mode: 'demo',
      message: !secret
        ? 'Demo-/Setup-Modus: Es ist kein STRIPE_SECRET_KEY hinterlegt. Es wurde keine Zahlung ausgelöst.'
        : `Demo-/Setup-Modus: Für ${missing.length} Produkt(e) fehlt die Stripe-Price-ID. Es wurde keine Zahlung ausgelöst.`,
      items: chosen.map((p) => ({ id: p.id, title: p.title, priceLabel: p.priceLabel })),
      totalCents, totalLabel: euroLabel(totalCents),
      discount: publicDiscount(dv)
    });
  }
  try {
    // Checkout truth: only pass a coupon Stripe will actually honor. When a valid code
    // has no linked Stripe coupon we do NOT fake a lower price — Stripe charges the
    // regular amount and the buyer can still enter a native promo code (allow_promotion_codes).
    const couponId = dv && dv.ok && dv.stripeCoupon ? dv.stripeCoupon : '';
    const metadata = {};
    if (dv && dv.ok) {
      metadata.discount_code = dv.code;
      if (dv.affiliateName) metadata.affiliate = dv.affiliateName;
      if (dv.source) metadata.discount_source = dv.source;
      metadata.discount_applied = couponId ? 'stripe' : 'preview-only';
    }
    const r = await stripe.createCheckoutSession({
      priceIds, productIds: ids, email, site: SITE,
      couponId, allowPromotionCodes: !couponId, metadata
    });
    if (!r.ok || !r.json || !r.json.url) {
      const detail = r.json && r.json.error && r.json.error.message ? r.json.error.message : 'unbekannter Fehler';
      return sendJson(res, 200, { mode: 'demo', message: `Stripe-Fehler: ${detail} Es wurde keine Zahlung ausgelöst.` });
    }
    return sendJson(res, 200, {
      mode: 'live', url: r.json.url, id: r.json.id,
      discountApplied: !!couponId, discount: publicDiscount(dv)
    });
  } catch (e) {
    return sendJson(res, 200, { mode: 'demo', message: 'Checkout-Server konnte Stripe nicht erreichen. Es wurde keine Zahlung ausgelöst.' });
  }
}

async function handleNewsletter(req, res) {
  const body = await readJson(req);
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const source = typeof body.source === 'string' ? body.source.trim().slice(0, 80) : 'website';
  const interest = typeof body.interest === 'string' ? body.interest.trim().slice(0, 80) : '';
  // Lightweight, forgiving email check — never 500 on a user typo.
  if (!email || email.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return sendJson(res, 200, { ok: false, error: 'invalid_email', message: 'Bitte gib eine gültige E-Mail-Adresse ein.' });
  }
  try {
    const r = await store.addNewsletterSubscriber({ email, source, interest });
    if (!r.ok) return sendJson(res, 200, { ok: false, error: 'invalid_email', message: 'Bitte gib eine gültige E-Mail-Adresse ein.' });
    return sendJson(res, 200, {
      ok: true, already: !!r.already,
      message: r.already
        ? 'Du bist bereits eingetragen — danke, dass du dabei bist!'
        : 'Eingetragen! Du bekommst Trainings-Tipps und Launch-Angebote von ZENITH.'
    });
  } catch (e) {
    return sendJson(res, 200, { ok: false, error: 'server', message: 'Eintragen hat gerade nicht geklappt. Bitte später erneut versuchen.' });
  }
}

async function handleComplete(req, res, url) {
  const sid = url.searchParams.get('session_id');
  if (!sid) return sendJson(res, 400, { ok: false, message: 'session_id fehlt' });
  if (!stripe.stripeConfigured()) return sendJson(res, 200, { ok: false, mode: 'demo', message: 'Kein Stripe konfiguriert (Demo-Modus). Es wurde keine Zahlung verarbeitet.' });
  try {
    const r = await stripe.retrieveSession(sid);
    if (!r.ok || !r.json) return sendJson(res, 200, { ok: false, message: 'Session konnte nicht geladen werden.' });
    const s = r.json;
    const paid = s.payment_status === 'paid' || s.status === 'complete';
    if (!paid) return sendJson(res, 200, { ok: false, status: s.payment_status || s.status, message: 'Zahlung ist noch nicht bestätigt.' });
    const byId = productMap();
    const email = (s.customer_details && s.customer_details.email) || s.customer_email || (s.metadata && s.metadata.email) || '';
    const productIds = String((s.metadata && s.metadata.product_ids) || '').split(',').map((x) => x.trim()).filter((id) => byId[id]);
    if (!email || !productIds.length) return sendJson(res, 200, { ok: false, message: 'Bestelldaten unvollständig.' });
    // Store fulfillment still runs (account dashboard, idempotency, webhook backstop),
    // but the access link itself is a stateless v2 token derived from the verified Stripe
    // session — it works even if the JSON store/disk didn't persist this write.
    const { entitlements } = await store.fulfillSession(sid, email, productIds);
    await maybeRecordRedemption(s);
    const user = auth.readSession(req);
    const matches = !!user && store.canonEmail(user.email) === store.canonEmail(email);
    const products = entitlements.map((e) => deliveryForProduct(byId[e.productId] || { id: e.productId, title: e.productId }, email, sid));
    const mail = await maybeSendPurchaseEmail({ sessionId: sid, email, products });
    return sendJson(res, 200, { ok: true, email, products, loggedIn: !!user, matches, mail: mail.sent ? 'sent' : (mail.skipped ? 'skipped' : 'not_sent') });
  } catch (e) {
    return sendJson(res, 200, { ok: false, message: 'Verarbeitung fehlgeschlagen.' });
  }
}

async function handleWebhook(req, res) {
  const raw = await readBody(req);
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return sendJson(res, 400, { error: 'STRIPE_WEBHOOK_SECRET nicht gesetzt — Webhook deaktiviert. Siehe SELLING_LIVE_SETUP.md' });
  const event = stripe.verifyWebhook(raw, req.headers['stripe-signature'], secret);
  if (!event) return sendJson(res, 400, { error: 'ungültige Signatur' });
  try {
    if (event.type === 'checkout.session.completed') {
      const s = event.data.object;
      const byId = productMap();
      const email = (s.customer_details && s.customer_details.email) || s.customer_email || (s.metadata && s.metadata.email) || '';
      const ids = String((s.metadata && s.metadata.product_ids) || '').split(',').map((x) => x.trim()).filter((id) => byId[id]);
      if (email && ids.length) {
        await store.fulfillSession(s.id, email, ids);
        await maybeRecordRedemption(s);
        const products = ids.map((id) => deliveryForProduct(byId[id], email, s.id));
        await maybeSendPurchaseEmail({ sessionId: s.id, email, products });
      }
    }
  } catch (e) { /* swallow — still 200 so Stripe doesn't retry forever on our bug */ }
  return sendJson(res, 200, { received: true });
}

async function handleMe(req, res) {
  const user = auth.readSession(req);
  const base = { googleConfigured: auth.googleConfigured(), devAuth: auth.devAuthEnabled(), checkoutMode: statusPayload(req).mode };
  if (!user) return sendJson(res, 200, { loggedIn: false, ...base });
  const byId = productMap();
  const ents = await store.getEntitlementsByEmail(user.email);
  const products = ents.map((e) => { const product = byId[e.productId] || { id: e.productId, title: e.productId }; const accessPath = '/access/' + auth.accessToken(e.id); return { id: e.productId, title: product.title, accessPath, downloadPath: planPdfExists(product) ? downloadPathForAccess(accessPath) : null, createdAt: e.createdAt }; });
  return sendJson(res, 200, { loggedIn: true, user: { email: user.email, name: user.name, picture: user.picture }, products, ...base });
}

function renderAccessForProductEmail(res, productId, email, token) {
  const product = productMap()[productId];
  if (!product) return lockedPage(res, 404, 'Nicht gefunden', 'Das Produkt existiert nicht mehr.');
  const inner = extractPlanInner(product.slug);
  if (!inner) return lockedPage(res, 500, 'Inhalt fehlt', 'Der Planinhalt konnte nicht geladen werden.');
  return renderAccessPage(res, product, email, inner, token);
}

async function handleAccessDownload(req, res, pathname) {
  const encoded = pathname.slice('/access/'.length, -'/download.pdf'.length);
  const clean = encoded.endsWith('/') ? encoded.slice(0, -1) : encoded;
  const token = decodeURIComponent(clean);
  let productId = null; let email = '';

  if (auth.isDeliveryToken(token)) {
    const d = auth.verifyDeliveryToken(token);
    if (!d) return lockedPage(res, 404, 'Link ungültig', 'Dieser Download-Link ist ungültig oder unvollständig.');
    productId = d.productId; email = d.email;
  } else {
    const entId = auth.verifyAccessToken(token);
    if (!entId) return lockedPage(res, 404, 'Link ungültig', 'Dieser Download-Link ist ungültig oder unvollständig.');
    const ent = await store.getEntitlementById(entId);
    if (!ent) return lockedPage(res, 404, 'Nicht gefunden', 'Zu diesem Download-Link gibt es keinen Zugang.');
    productId = ent.productId; email = ent.email;
  }
  const product = productMap()[productId];
  if (!product || !planPdfExists(product)) return lockedPage(res, 404, 'PDF fehlt', 'Für diesen Plan ist noch kein PDF hinterlegt.');
  try {
    const data = await readFile(planPdfPath(product));
    send(res, 200, data, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${planPdfName(product)}"`,
      'X-Zenith-Access-Email': email
    });
  } catch (e) { return lockedPage(res, 500, 'Download fehlgeschlagen', 'Der PDF-Download konnte nicht geladen werden.'); }
}

async function handleAccess(req, res, pathname) {
  const token = decodeURIComponent(pathname.slice('/access/'.length));

  // v2: stateless, self-verifying — no store lookup needed.
  if (auth.isDeliveryToken(token)) {
    const d = auth.verifyDeliveryToken(token);
    if (!d) return lockedPage(res, 404, 'Link ungültig', 'Dieser Zugangslink ist ungültig oder unvollständig.');
    return renderAccessForProductEmail(res, d.productId, d.email, token);
  }

  // v1: legacy entitlement-id token — still honored so old links never break.
  const entId = auth.verifyAccessToken(token);
  if (!entId) return lockedPage(res, 404, 'Link ungültig', 'Dieser Zugangslink ist ungültig oder unvollständig.');
  const ent = await store.getEntitlementById(entId);
  if (!ent) return lockedPage(res, 404, 'Nicht gefunden', 'Zu diesem Link gibt es keinen Zugang.');
  return renderAccessForProductEmail(res, ent.productId, ent.email, token);
}

// Google OAuth
function handleGoogleStart(res, url) {
  if (!auth.googleConfigured()) return redirect(res, '/account.html?google=unconfigured');
  const ret = auth.sanitizeReturn(url.searchParams.get('return'));
  const q = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: SITE + '/auth/google/callback',
    response_type: 'code',
    scope: 'openid email profile',
    state: auth.makeState(ret),
    access_type: 'online',
    prompt: 'select_account'
  });
  redirect(res, 'https://accounts.google.com/o/oauth2/v2/auth?' + q.toString());
}
async function handleGoogleCallback(req, res, url) {
  if (!auth.googleConfigured()) return redirect(res, '/account.html?google=unconfigured');
  const code = url.searchParams.get('code');
  const ret = auth.readState(url.searchParams.get('state'));
  if (!ret) return redirect(res, '/account.html?error=state');
  if (!code) return redirect(res, '/account.html?error=nocode');
  try {
    const tokRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code, client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: SITE + '/auth/google/callback', grant_type: 'authorization_code'
      }).toString()
    });
    const tok = await tokRes.json();
    if (!tokRes.ok || !tok.access_token) return redirect(res, '/account.html?error=token');
    const uiRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${tok.access_token}` } });
    const ui = await uiRes.json();
    if (!ui || !ui.email || ui.email_verified === false) return redirect(res, '/account.html?error=email');
    const u = await store.upsertUser({ email: ui.email, name: ui.name || '', picture: ui.picture || '', provider: 'google' });
    return redirect(res, ret, auth.makeSessionCookie(u || { email: ui.email, name: ui.name, picture: ui.picture }, SECURE));
  } catch (e) {
    return redirect(res, '/account.html?error=oauth');
  }
}

// DEV-only routes (never active unless DEV_AUTH=1)
async function handleDevLogin(req, res) {
  const body = await readJson(req);
  const email = String(body.email || '').trim();
  if (!email) return sendJson(res, 400, { ok: false, error: 'email fehlt' });
  const u = await store.upsertUser({ email, name: body.name || 'Testkonto', picture: '', provider: 'dev' });
  return sendJson(res, 200, { ok: true, user: { email: u.email, name: u.name } }, { 'Set-Cookie': auth.makeSessionCookie(u, SECURE) });
}
async function handleDevGrant(req, res) {
  const user = auth.readSession(req);
  if (!user) return sendJson(res, 401, { ok: false, error: 'nicht eingeloggt' });
  const body = await readJson(req);
  const byId = productMap();
  const pid = body.productId;
  if (!byId[pid]) return sendJson(res, 400, { ok: false, error: 'unbekanntes Produkt' });
  const ent = await store.grantEntitlement(user.email, pid, 'dev');
  return sendJson(res, 200, { ok: true, product: { id: pid, title: byId[pid].title, accessPath: '/access/' + auth.accessToken(ent.id) } });
}

// ---------------- static ----------------
async function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === '/' || rel === '') rel = '/index.html';

  // Hard blocks: server internals, env, raw db.
  if (rel.startsWith('/server/') || rel === '/.env' || rel.startsWith('/.env') || rel.startsWith('/.git')) {
    return lockedPage(res, 403, 'Gesperrt', 'Dieser Bereich ist nicht öffentlich.');
  }
  // Discount codes are validated server-side only — never expose the raw config
  // (holds affiliate names + Stripe coupon links) or let the code list be enumerated.
  if (rel === '/data/discount-codes.json') {
    return lockedPage(res, 403, 'Gesperrt', 'Diese Datei ist nicht öffentlich.');
  }
  // Block full buyer plan files in the public plans folder (plan.css stays allowed).
  if (/^\/products\/plans\/.+\.(html|md)$/i.test(rel)) {
    return lockedPage(res, 403, 'Nur für Käufer', 'Die vollständigen Pläne sind privat. Nach dem Kauf erhältst du einen persönlichen Zugangslink in deinem Konto.');
  }

  const filePath = normalize(join(ROOT, rel));
  if (!filePath.startsWith(ROOT)) return lockedPage(res, 403, 'Gesperrt', 'Ungültiger Pfad.');
  try {
    const info = await stat(filePath);
    const target = info.isDirectory() ? join(filePath, 'index.html') : filePath;
    const data = await readFile(target);
    send(res, 200, data, { 'Content-Type': MIME[extname(target).toLowerCase()] || 'application/octet-stream' });
  } catch (e) {
    send(res, 404, '<h1>404</h1><p>Nicht gefunden. <a href="/">Zur Startseite</a></p>', { 'Content-Type': 'text/html; charset=utf-8' });
  }
}

// ---------------- router ----------------
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
    const p = url.pathname;
    const m = req.method;

    if (p === '/api/checkout-status' && m === 'GET') return sendJson(res, 200, statusPayload(req));
    if (p === '/api/create-checkout-session' && m === 'POST') return handleCreateSession(req, res);
    if (p === '/api/discount/validate' && m === 'POST') return handleDiscountValidate(req, res);
    if (p === '/api/newsletter' && m === 'POST') return handleNewsletter(req, res);
    if (p === '/api/checkout/complete' && m === 'GET') return handleComplete(req, res, url);
    if (p === '/api/stripe/webhook' && m === 'POST') return handleWebhook(req, res);
    if (p === '/api/me' && m === 'GET') return handleMe(req, res);
    if (p === '/api/logout' && m === 'POST') return sendJson(res, 200, { ok: true }, { 'Set-Cookie': auth.clearSessionCookie(SECURE) });

    if (p === '/auth/google/start' && m === 'GET') return handleGoogleStart(res, url);
    if (p === '/auth/google/callback' && m === 'GET') return handleGoogleCallback(req, res, url);

    if (auth.devAuthEnabled() && p === '/api/dev/login' && m === 'POST') return handleDevLogin(req, res);
    if (auth.devAuthEnabled() && p === '/api/dev/grant' && m === 'POST') return handleDevGrant(req, res);

    if (p.startsWith('/access/') && p.endsWith('/download.pdf') && m === 'GET') return handleAccessDownload(req, res, p);
    if (p.startsWith('/access/') && m === 'GET') return handleAccess(req, res, p);

    if (p.startsWith('/api/')) return sendJson(res, 404, { error: 'unknown endpoint' });
    if (m !== 'GET' && m !== 'HEAD') return sendJson(res, 405, { error: 'method not allowed' });
    return serveStatic(req, res, p);
  } catch (e) {
    sendJson(res, 500, { error: 'server error' });
  }
});

server.listen(PORT, () => {
  const s = statusPayload({ headers: {} });
  console.log(`ZENITH server: ${SITE}`);
  console.log(`  Stripe:  ${s.mode === 'live' ? 'LIVE' : 'DEMO/Setup'}   Google: ${s.googleConfigured ? 'konfiguriert' : 'fehlt'}   DEV_AUTH: ${s.devAuth ? 'AN (nur lokal!)' : 'aus'}`);
  if (auth.sessionSecretMissing) console.log('  ! SESSION_SECRET fehlt — Sessions sind nur temporär. Für Produktion in .env setzen.');
});
