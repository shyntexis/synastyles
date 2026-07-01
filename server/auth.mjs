// Sessions, derived access tokens and OAuth-state — all HMAC-signed with SESSION_SECRET.
// Access tokens are NOT stored anywhere: they are derived from the entitlement id, so
// they can always be recomputed for the owner, and cannot be forged without the secret.
import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';

const SESSION_SECRET = process.env.SESSION_SECRET || ('ephemeral-' + randomBytes(24).toString('hex'));
export const sessionSecretMissing = !process.env.SESSION_SECRET;

const COOKIE = 'zsess';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const b64url = (buf) => Buffer.from(buf).toString('base64url');
function sign(data, label) {
  return createHmac('sha256', SESSION_SECRET + ':' + label).update(data).digest('base64url');
}
function safeEq(a, b) {
  const A = Buffer.from(String(a)); const B = Buffer.from(String(b));
  return A.length === B.length && timingSafeEqual(A, B);
}

export function googleConfigured() { return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET); }
export function devAuthEnabled() { return process.env.DEV_AUTH === '1'; }

// ---- session cookie ----
export function makeSessionCookie(user, secure) {
  const payload = b64url(JSON.stringify({ e: user.email, n: user.name || '', p: user.picture || '', t: Math.floor(Date.now() / 1000) }));
  const val = payload + '.' + sign(payload, 'session');
  const attrs = [`${COOKIE}=${val}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${MAX_AGE}`];
  if (secure) attrs.push('Secure');
  return attrs.join('; ');
}
export function clearSessionCookie(secure) {
  const attrs = [`${COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (secure) attrs.push('Secure');
  return attrs.join('; ');
}
export function readSession(req) {
  const cookie = req.headers.cookie || '';
  const part = cookie.split(/; */).find((c) => c.startsWith(COOKIE + '='));
  if (!part) return null;
  const val = part.slice(COOKIE.length + 1);
  const i = val.lastIndexOf('.');
  if (i < 0) return null;
  const payload = val.slice(0, i); const sig = val.slice(i + 1);
  if (!safeEq(sig, sign(payload, 'session'))) return null;
  try {
    const o = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!o.e) return null;
    if (o.t && (Math.floor(Date.now() / 1000) - o.t) > MAX_AGE) return null;
    return { email: o.e, name: o.n || '', picture: o.p || '' };
  } catch (e) { return null; }
}

// ---- derived access token ----
export function accessToken(entitlementId) { return entitlementId + '.' + sign(entitlementId, 'access'); }
export function verifyAccessToken(token) {
  if (!token || typeof token !== 'string') return null;
  const i = token.lastIndexOf('.');
  if (i < 0) return null;
  const id = token.slice(0, i); const sig = token.slice(i + 1);
  if (!safeEq(sig, sign(id, 'access'))) return null;
  return id;
}

// ---- oauth state (return path, signed, open-redirect-safe) ----
export function makeState(returnPath) {
  const r = sanitizeReturn(returnPath);
  const data = b64url(JSON.stringify({ r, n: randomBytes(8).toString('hex') }));
  return data + '.' + sign(data, 'state');
}
export function readState(state) {
  if (!state) return null;
  const i = state.lastIndexOf('.');
  if (i < 0) return null;
  const data = state.slice(0, i); const sig = state.slice(i + 1);
  if (!safeEq(sig, sign(data, 'state'))) return null;
  try { return sanitizeReturn(JSON.parse(Buffer.from(data, 'base64url').toString('utf8')).r); }
  catch (e) { return '/account.html'; }
}
export function sanitizeReturn(p) {
  // only allow same-origin absolute paths like "/account.html" or "/access/xyz"
  if (typeof p !== 'string' || !/^\/[^/\\]/.test(p)) return '/account.html';
  return p;
}
