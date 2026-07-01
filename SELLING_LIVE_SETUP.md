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

Live-Domain dieses Projekts: **https://zenith-gym-coaching-site.onrender.com**

1. Stripe Dashboard (Live-Modus) → Entwickler → Webhooks → Endpoint hinzufügen.
2. Endpoint-URL exakt: `https://zenith-gym-coaching-site.onrender.com/api/stripe/webhook`
3. Event: `checkout.session.completed` (reicht für die Freischaltung).
4. Signing-Secret (`whsec_…`) kopieren → als `STRIPE_WEBHOOK_SECRET` in Render/`.env` setzen.
5. Danach **redeploy** (damit die Env-Variable geladen wird).
6. Kontrolle: `/api/checkout-status` zeigt `webhookConfigured: true`.

Der Webhook ist die zuverlässige Quelle der Freischaltung (auch wenn der Käufer die Success-Seite
nie öffnet): `checkout.session.completed` → `store.fulfillSession(...)`. Ohne `STRIPE_WEBHOOK_SECRET`
ist die Route deaktiviert (kein Crash, HTTP 400); dann erfolgt die Freischaltung über
`/api/checkout/complete` beim Aufruf der Success-Seite. Das Signing Secret gehört nie ins Repo.

## 4. Google OAuth (optional)

Google-Login ist **optional** — nur für den späteren Konto-Komfort. Für den ersten Verkauf ist er
**nicht** nötig: Nach der Zahlung erhält der Käufer einen persönlichen Zugangslink (`/access/…`) und
kann seine Pläne ohne Login öffnen. Ist Google nicht konfiguriert, zeigt die UI (Konto- und
Checkout-Seite) einen klaren Hinweis „optional, Käufe funktionieren über Zugangslink".

1. Google Cloud Console → APIs & Dienste → OAuth-Zustimmungsbildschirm einrichten.
2. Anmeldedaten → OAuth-Client-ID → **Webanwendung**.
3. Autorisierte Redirect-URI exakt: `https://zenith-gym-coaching-site.onrender.com/auth/google/callback`
4. Client-ID/Secret → `.env`/Render (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`), danach redeploy.

Fehlt Google: Der Login-Button zeigt einen sauberen Setup-Hinweis statt zu crashen.

## 5. Sicherheitsmodell (Kurzfassung)

- **Secrets** nur in `.env` / serverseitig — nie im Frontend, nie in Logs.
- **Login** über Google → signiertes, HttpOnly-Session-Cookie (HMAC mit `SESSION_SECRET`).
- **Freischaltung (Entitlement)** entsteht nur serverseitig nach Stripe-Verifikation (Webhook oder
  `/api/checkout/complete`). Kein Client kann sich selbst freischalten.
- **Zugangslinks** `/access/<token>`: pro Kauf/Produkt ein eigener Token (aus der Entitlement-ID
  + Secret abgeleitet, nicht im Klartext gespeichert). Der Link funktioniert nach bestätigter Zahlung
  direkt ohne Google-Login, damit Käufer ihre digitalen Inhalte sofort öffnen können. Google-Login ist
  nur optionaler Konto-Komfort; rohe Plan-Dateien bleiben trotzdem gesperrt.
- **Volle Pläne** liegen in `server/private/plans/` und werden **nicht** öffentlich ausgeliefert;
  direkte Aufrufe von `/products/plans/*.html|*.md` sind gesperrt.

## 6. Rechtliches VOR dem echten Verkauf (nicht optional)

Die Seiten sind angelegt und im Footer/Checkout verlinkt:

- **Impressum** → `impressum.html`
- **Datenschutzerklärung** → `datenschutz.html` (Hosting, Stripe, optionaler Google-Login, Cookies, Logs)
- **AGB** → `agb.html`
- **Widerrufsbelehrung** → `widerruf.html` (inkl. Erlöschen des Widerrufsrechts bei digitalen Inhalten
  nach ausdrücklicher Zustimmung + Muster-Widerrufsformular)

**Noch zu tun (Pflicht vor Verkaufsstart):** In diesen vier Dateien alle als
`BITTE ERGÄNZEN` markierten Felder mit echten Daten füllen — insbesondere vollständiger Name,
Anschrift, und Steuerstatus (USt-IdNr. **oder** Kleinunternehmer-Hinweis nach § 19 UStG). Es wurden
bewusst **keine erfundenen Angaben** eingesetzt. Dies ist keine Rechtsberatung.

Im Checkout muss der Käufer vor „Sicher bezahlen" aktiv bestätigen: AGB akzeptiert, Datenschutz zur
Kenntnis genommen, Widerrufsbelehrung gelesen, und (digitale Inhalte) ausdrückliche Zustimmung zur
sofortigen Bereitstellung mit Kenntnis, dass das Widerrufsrecht damit erlischt. Diese Checkboxen sind
im Checkout-Modal integriert und werden serverunabhängig im Frontend erzwungen.

## 7. Inhaltliche Haftung

Alle Pläne/Videos sind allgemeine Trainings-/Lifestyle-Informationen, **keine medizinische Beratung**
und **keine garantierten Ergebnisse**.

## 8. Videos

Siehe `VIDEO_WORKFLOW.md` + `data/video-workflow.json`. Die Coaching-Videos (echter Mensch + KI)
sind noch **nicht** produziert; dort steht der empfohlene Produktions-Workflow.
