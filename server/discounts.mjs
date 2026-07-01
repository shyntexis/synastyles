// ZENITH discount / promo / affiliate codes — pure JSON config, zero external deps.
//
// CHECKOUT TRUTH: a discount only reduces the amount Stripe actually charges when a
// real Stripe coupon is linked to the code (stripeCouponId literal, or an id read from
// the env var named in stripeCouponEnvKey). Without a linked coupon the code is a
// PREVIEW only (marketing display / demo math) and the regular price is charged. The
// site must never claim a lower final price than Stripe will really take — validate()
// reports `stripeApplied` so callers can be honest.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CONFIG_PATH = process.env.ZENITH_DISCOUNTS_PATH || join(ROOT, 'data', 'discount-codes.json');

export const normalizeCode = (c) => String(c || '').trim().toUpperCase().replace(/\s+/g, '');

// Load + validate config defensively. A broken/missing file yields an empty list,
// so a bad edit can never crash checkout — codes simply stop matching.
function loadCodes() {
  try {
    const raw = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
    const list = Array.isArray(raw && raw.codes) ? raw.codes : [];
    return list.filter((c) => c && typeof c.code === 'string' && c.code.trim());
  } catch (e) { return []; }
}

export function listActiveCodes() {
  return loadCodes().filter((c) => c.active !== false).map((c) => normalizeCode(c.code));
}

export function findCode(code) {
  const norm = normalizeCode(code);
  if (!norm) return null;
  return loadCodes().find((c) => normalizeCode(c.code) === norm) || null;
}

// Resolve a linked Stripe coupon id. Literal wins over env key. '' when none linked.
export function resolveStripeCoupon(entry) {
  if (!entry) return '';
  const lit = entry.stripeCouponId != null ? String(entry.stripeCouponId).trim() : '';
  if (lit) return lit;
  const key = entry.stripeCouponEnvKey ? String(entry.stripeCouponEnvKey).trim() : '';
  if (key && process.env[key]) return String(process.env[key]).trim();
  return '';
}

function withinWindow(entry, nowMs) {
  const parse = (s) => { const t = Date.parse(s); return Number.isNaN(t) ? null : t; };
  if (entry.startsAt) { const s = parse(entry.startsAt); if (s !== null && nowMs < s) return { ok: false, reason: 'not_started' }; }
  if (entry.endsAt) { const e = parse(entry.endsAt); if (e !== null && nowMs > e) return { ok: false, reason: 'expired' }; }
  return { ok: true };
}

// items: [{ id, priceCents }]. redemptions: prior redemption count (for maxRedemptions).
// Never throws; always returns a plain object with { ok, ... }.
export function validateDiscount({ code, items, redemptions = 0, nowMs = Date.now() } = {}) {
  const norm = normalizeCode(code);
  const list = Array.isArray(items) ? items.filter((it) => it && Number.isFinite(it.priceCents)) : [];
  if (!norm) return { ok: false, code: '', reason: 'empty', message: 'Bitte gib einen Code ein.' };
  if (!list.length) return { ok: false, code: norm, reason: 'empty_cart', message: 'Dein Warenkorb ist leer.' };

  const entry = findCode(norm);
  if (!entry || entry.active === false) {
    return { ok: false, code: norm, reason: 'unknown', message: 'Dieser Code ist ungültig oder nicht mehr aktiv.' };
  }

  const win = withinWindow(entry, nowMs);
  if (!win.ok) {
    return { ok: false, code: norm, reason: win.reason,
      message: win.reason === 'expired' ? 'Dieser Code ist abgelaufen.' : 'Dieser Code ist noch nicht aktiv.' };
  }
  if (entry.maxRedemptions != null && Number.isFinite(Number(entry.maxRedemptions)) && redemptions >= Number(entry.maxRedemptions)) {
    return { ok: false, code: norm, reason: 'exhausted', message: 'Dieser Code wurde bereits vollständig eingelöst.' };
  }

  const applies = Array.isArray(entry.appliesToProductIds) && entry.appliesToProductIds.length
    ? new Set(entry.appliesToProductIds) : null;
  const eligible = applies ? list.filter((it) => applies.has(it.id)) : list;
  const subtotalCents = list.reduce((s, it) => s + it.priceCents, 0);
  const eligibleCents = eligible.reduce((s, it) => s + it.priceCents, 0);

  if (!eligible.length) {
    return { ok: false, code: norm, reason: 'not_applicable', subtotalCents,
      message: 'Dieser Code gilt für keins der Produkte in deinem Warenkorb.' };
  }
  if (entry.minSubtotalCents && subtotalCents < Number(entry.minSubtotalCents)) {
    return { ok: false, code: norm, reason: 'min_subtotal', subtotalCents,
      message: 'Der Mindestbestellwert für diesen Code ist nicht erreicht.' };
  }

  let discountCents = 0;
  const pct = Number(entry.percentOff);
  const amt = Number(entry.amountOffCents);
  if (Number.isFinite(pct) && pct > 0) discountCents = Math.round(eligibleCents * (Math.min(pct, 100) / 100));
  else if (Number.isFinite(amt) && amt > 0) discountCents = Math.min(amt, eligibleCents);
  discountCents = Math.max(0, Math.min(discountCents, subtotalCents));
  const newTotalCents = Math.max(0, subtotalCents - discountCents);

  const stripeCoupon = resolveStripeCoupon(entry);
  return {
    ok: true,
    code: norm,
    campaignName: entry.campaignName || '',
    affiliateName: entry.affiliateName || null,
    source: entry.source || (entry.affiliateName ? 'affiliate' : 'promo'),
    percentOff: Number.isFinite(pct) && pct > 0 ? pct : null,
    amountOffCents: Number.isFinite(amt) && amt > 0 ? amt : null,
    subtotalCents,
    discountCents,
    newTotalCents,
    stripeCoupon,               // internal — the resolved coupon id ('' if none)
    stripeApplied: !!stripeCoupon // true only when Stripe will really charge the discounted amount
  };
}
