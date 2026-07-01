# Live gehen & Geld verdienen — Setup

Diese Plattform braucht einen **Node-Server** (für Login, Stripe und geschützte Plan-Auslieferung).
Ein reiner Static-Host (GitHub Pages, Netlify-Static ohne Functions) reicht **nicht**, weil Auth,
Stripe-Verifikation, Webhooks und die privaten Käuferinhalte serverseitig laufen müssen.

## 1. Hosting (Node)

Eignet sich: Render, Railway, Fly.io, ein VPS (Hetzner/DigitalOcean) mit Node 18+, oder ähnliches.

- Start-Command: `node server/checkout-server.mjs` (bzw. `npm start`)
- Node ≥ 18 (globales `fetch`).
- Eigene Domain mit **HTTPS** (Pflicht für Stripe/Google und sichere Cookies).
- Persistenter Speicher: `server/private/db.json` muss über Deploys hinweg erhalten bleiben
  (Volume/Disk). Für mehr Last später eine echte DB (SQLite/Postgres) — der Store ist bewusst
  klein und austauschbar (`server/store.mjs`).

## 2. `.env` auf dem Server

`cp .env.example .env` und ausfüllen:

```
PUBLIC_SITE_URL=https://deine-domain.de
SESSION_SECRET=<langer Zufallswert>      # node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
STRIPE_SECRET_KEY=<live secret key from Stripe Dashboard>
STRIPE_WEBHOOK_SECRET=<Stripe webhook signing secret>
STRIPE_PRICE_...=price_...                # alle 8, siehe CHECKOUT_SETUP.md
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
DEV_AUTH=0
```

`DEV_AUTH` MUSS in Produktion `0` sein (Default ist aus). Sonst könnte man ohne Zahlung freischalten.

## 3. Stripe Webhook

1. Stripe Dashboard → Entwickler → Webhooks → Endpoint hinzufügen.
2. URL: `https://deine-domain.de/api/stripe/webhook`
3. Event: `checkout.session.completed` (reicht für die Freischaltung).
4. Signing-Secret kopieren → `STRIPE_WEBHOOK_SECRET` in `.env`.

Der Webhook ist die zuverlässige Quelle der Freischaltung (auch wenn der Käufer die Success-Seite
nie öffnet). Ohne `STRIPE_WEBHOOK_SECRET` ist die Route deaktiviert (kein Crash); dann erfolgt die
Freischaltung über `/api/checkout/complete` beim Aufruf der Success-Seite.

## 4. Google OAuth

1. Google Cloud Console → APIs & Dienste → OAuth-Zustimmungsbildschirm einrichten.
2. Anmeldedaten → OAuth-Client-ID → **Webanwendung**.
3. Autorisierte Redirect-URI: `https://deine-domain.de/auth/google/callback`
4. Client-ID/Secret → `.env` (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`).

Fehlt Google: Der Login-Button zeigt einen sauberen Setup-Hinweis statt zu crashen.

## 5. Sicherheitsmodell (Kurzfassung)

- **Secrets** nur in `.env` / serverseitig — nie im Frontend, nie in Logs.
- **Login** über Google → signiertes, HttpOnly-Session-Cookie (HMAC mit `SESSION_SECRET`).
- **Freischaltung (Entitlement)** entsteht nur serverseitig nach Stripe-Verifikation (Webhook oder
  `/api/checkout/complete`). Kein Client kann sich selbst freischalten.
- **Zugangslinks** `/access/<token>`: pro Kauf/Produkt ein eigener Token (aus der Entitlement-ID
  + Secret abgeleitet, nicht im Klartext gespeichert). Der Link funktioniert nur eingeloggt und nur
  für die Käufer-E-Mail. Geteilte Links ohne passenden Login → Weiterleitung zum Login / 403.
- **Volle Pläne** liegen in `server/private/plans/` und werden **nicht** öffentlich ausgeliefert;
  direkte Aufrufe von `/products/plans/*.html|*.md` sind gesperrt.

## 6. Rechtliches VOR dem echten Verkauf (nicht optional)

- Vollständiges **Impressum** (Name, Anschrift, ggf. USt-/Steuernummer oder Kleinunternehmer-Hinweis).
- **Datenschutzerklärung** (Google-Login, Stripe, Cookies, Server-Logs).
- **AGB** und **Widerrufsbelehrung**; bei digitalen Inhalten: Hinweis zum Erlöschen des
  Widerrufsrechts bei sofortiger Bereitstellung nach ausdrücklicher Zustimmung.
- Steuer/Umsatzsteuer klären.

Diese Seite behauptet **nicht**, dass diese Punkte bereits erfüllt sind. Der Footer weist offen
darauf hin.

## 7. Inhaltliche Haftung

Alle Pläne/Videos sind allgemeine Trainings-/Lifestyle-Informationen, **keine medizinische Beratung**
und **keine garantierten Ergebnisse**.

## 8. Videos

Siehe `VIDEO_WORKFLOW.md` + `data/video-workflow.json`. Die Coaching-Videos (echter Mensch + KI)
sind noch **nicht** produziert; dort steht der empfohlene Produktions-Workflow.
