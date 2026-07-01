// Tiny JSON store for users + entitlements. Lives in server/private (never served).
// Atomic writes (temp -> rename) and a simple serialized mutex to avoid races.
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Default local store lives in server/private (ignored by Git). In production,
// set ZENITH_DATA_DIR to a persistent disk mount (e.g. /var/data on Render) so
// buyer accounts and entitlements survive deploys/restarts.
const DB_DIR = process.env.ZENITH_DATA_DIR || join(__dirname, 'private');
const DB_PATH = process.env.ZENITH_DB_PATH || join(DB_DIR, 'db.json');

const nowIso = () => new Date().toISOString();
const canon = (e) => String(e || '').trim().toLowerCase();
const rid = (p) => p + '_' + randomBytes(12).toString('hex');

function emptyDb() { return { users: [], entitlements: [], processedSessions: {} }; }

async function readDb() {
  try {
    const d = JSON.parse(await readFile(DB_PATH, 'utf8'));
    d.users ||= []; d.entitlements ||= []; d.processedSessions ||= {};
    return d;
  } catch (e) { return emptyDb(); }
}
async function writeDb(db) {
  if (!existsSync(DB_DIR)) await mkdir(DB_DIR, { recursive: true });
  const tmp = DB_PATH + '.tmp-' + randomBytes(4).toString('hex');
  await writeFile(tmp, JSON.stringify(db, null, 2), 'utf8');
  await rename(tmp, DB_PATH);
}

let chain = Promise.resolve();
function withDb(fn) {
  const run = chain.then(() => readDb()).then(async (db) => {
    const r = await fn(db);
    await writeDb(db);
    return r;
  });
  chain = run.catch(() => {}); // keep the mutex alive even if one op throws
  return run;
}

export const canonEmail = canon;

export async function upsertUser({ email, name, picture, provider }) {
  const e = canon(email);
  if (!e) return null;
  return withDb((db) => {
    let u = db.users.find((x) => x.email === e);
    if (!u) {
      u = { id: rid('u'), email: e, name: name || '', picture: picture || '', provider: provider || 'google', createdAt: nowIso() };
      db.users.push(u);
    } else {
      if (name) u.name = name;
      if (picture) u.picture = picture;
    }
    return u;
  });
}

export async function getUserByEmail(email) {
  const e = canon(email);
  const db = await readDb();
  return db.users.find((u) => u.email === e) || null;
}

export async function getEntitlementsByEmail(email) {
  const e = canon(email);
  const db = await readDb();
  return db.entitlements.filter((x) => x.email === e);
}

export async function getEntitlementById(id) {
  const db = await readDb();
  return db.entitlements.find((x) => x.id === id) || null;
}

// Single grant (used by DEV grant). Dedupes by (email, productId).
export async function grantEntitlement(email, productId, sessionId) {
  const e = canon(email);
  return withDb((db) => {
    let ent = db.entitlements.find((x) => x.email === e && x.productId === productId);
    if (!ent) {
      ent = { id: rid('e'), email: e, productId, sessionId: sessionId || 'manual', createdAt: nowIso() };
      db.entitlements.push(ent);
    }
    if (e && !db.users.find((u) => u.email === e)) {
      db.users.push({ id: rid('u'), email: e, name: '', picture: '', provider: 'manual', createdAt: nowIso() });
    }
    return ent;
  });
}

// Idempotent fulfillment for a paid Stripe session. Same sessionId never duplicates.
export async function fulfillSession(sessionId, email, productIds) {
  const e = canon(email);
  return withDb((db) => {
    const already = !!db.processedSessions[sessionId];
    const ents = [];
    for (const pid of productIds) {
      let ent = db.entitlements.find((x) => x.email === e && x.productId === pid);
      if (!ent) {
        ent = { id: rid('e'), email: e, productId: pid, sessionId, createdAt: nowIso() };
        db.entitlements.push(ent);
      }
      ents.push(ent);
    }
    if (e && !db.users.find((u) => u.email === e)) {
      db.users.push({ id: rid('u'), email: e, name: '', picture: '', provider: 'stripe', createdAt: nowIso() });
    }
    if (sessionId) db.processedSessions[sessionId] = db.processedSessions[sessionId] || nowIso();
    return { already, entitlements: ents };
  });
}
