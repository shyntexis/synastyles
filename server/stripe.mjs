// Thin Stripe REST wrapper (no SDK). Secret stays server-side via env only.
import { createHmac, timingSafeEqual } from 'node:crypto';

const API = 'https://api.stripe.com/v1';

export function stripeConfigured() { return !!process.env.STRIPE_SECRET_KEY; }

// Only reports whether the signing secret is present — never the value itself.
export function webhookConfigured() { return !!process.env.STRIPE_WEBHOOK_SECRET; }

function authHeaders() { return { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` }; }

async function post(path, params) {
  const res = await fetch(API + path, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });
  let json = null; try { json = await res.json(); } catch (e) { json = null; }
  return { ok: res.ok, status: res.status, json };
}
async function get(path) {
  const res = await fetch(API + path, { headers: authHeaders() });
  let json = null; try { json = await res.json(); } catch (e) { json = null; }
  return { ok: res.ok, status: res.status, json };
}

// couponId: a real Stripe coupon id → the discounted amount is what Stripe truly charges.
// allowPromotionCodes: show Stripe's own promo-code box at checkout (buyer types a
//   Stripe-native promotion code). Stripe forbids combining `discounts` with
//   `allow_promotion_codes`, so an explicit coupon wins and the box is suppressed.
// metadata: extra key/values (e.g. discount_code, affiliate) merged into session metadata.
export async function createCheckoutSession({ priceIds, productIds, email, site, couponId, allowPromotionCodes, metadata }) {
  const params = new URLSearchParams();
  params.set('mode', 'payment');
  params.set('success_url', `${site}/checkout-success.html?session_id={CHECKOUT_SESSION_ID}`);
  params.set('cancel_url', `${site}/checkout-cancel.html`);
  if (email) params.set('customer_email', email);
  priceIds.forEach((pid, i) => {
    params.set(`line_items[${i}][price]`, pid);
    params.set(`line_items[${i}][quantity]`, '1');
  });
  params.set('metadata[product_ids]', productIds.join(','));
  if (email) params.set('metadata[email]', email);
  if (metadata && typeof metadata === 'object') {
    for (const [k, v] of Object.entries(metadata)) {
      if (v != null && String(v) !== '') params.set(`metadata[${k}]`, String(v).slice(0, 480));
    }
  }
  if (couponId) {
    params.set('discounts[0][coupon]', String(couponId));
  } else if (allowPromotionCodes) {
    params.set('allow_promotion_codes', 'true');
  }
  return post('/checkout/sessions', params);
}

export async function retrieveSession(id) {
  return get('/checkout/sessions/' + encodeURIComponent(id));
}

// Verify a Stripe webhook signature (scheme: t=timestamp,v1=signature).
export function verifyWebhook(rawBody, sigHeader, secret, toleranceSec = 300) {
  if (!secret || !sigHeader) return null;
  const parts = {};
  for (const kv of String(sigHeader).split(',')) {
    const i = kv.indexOf('=');
    if (i > 0) parts[kv.slice(0, i).trim()] = kv.slice(i + 1).trim();
  }
  const t = parts.t; const v1 = parts.v1;
  if (!t || !v1) return null;
  const expected = createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex');
  const a = Buffer.from(expected); const b = Buffer.from(v1);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (toleranceSec && Math.abs(Math.floor(Date.now() / 1000) - Number(t)) > toleranceSec) return null;
  try { return JSON.parse(rawBody); } catch (e) { return null; }
}
