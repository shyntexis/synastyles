# ZENITH Gym Coaching — Plattform

Premium Black/Gold Coaching-Seite mit echten Plänen, Warenkorb, **Stripe-Checkout**,
direkten Käufer-Zugangslinks und **geschützter, personalisierter Plan-Auslieferung**.
Google-Login ist optionaler Konto-Komfort, aber kein Kauf-Blocker.

Projektordner: `C:\Users\Tristan\Desktop\2026-06-30_tristym-gym-coaching-site`

## Start (Node 18+, keine npm-Pakete nötig)

```bash
cd /c/Users/Tristan/Desktop/2026-06-30_tristym-gym-coaching-site
node server/checkout-server.mjs        # oder: npm start
# -> http://127.0.0.1:5097/
```

Beim Start zeigt die Konsole den Modus (Stripe LIVE/DEMO, Google konfiguriert?, DEV_AUTH?).
Ein reiner Static-Host reicht **nicht** — Auth/Stripe/Webhooks/geschützte Pläne laufen serverseitig.

## Struktur

```
index.html / styles.css / app.js   Landingpage + Warenkorb/Checkout (Premium Black/Gold)
account.html                       Konto-Dashboard (optionaler Google-Login, Käufe, Plan öffnen)
checkout-success.html / -cancel.html  Stripe Erfolg/Abbruch
data/products.json                 Produktdaten (Preise = einzige Quelle der Wahrheit)
data/video-workflow.json           Video-Pipeline-Daten
products/plans/plan.css            Öffentliches Stylesheet der Plan-Seiten
server/checkout-server.mjs         HTTP-Server: Static + alle APIs + /access-Auslieferung
server/auth.mjs                    Session-Cookies, abgeleitete Access-Tokens, OAuth-State
server/store.mjs                   JSON-Store (users/entitlements) — atomar, never-crash
server/stripe.mjs                  Stripe REST (Checkout-Session, Webhook-Verify)
server/private/plans/*.html|*.md   VOLLE Käuferinhalte (NICHT öffentlich ausgeliefert)
server/private/db.json             Käuferdaten (gitignored, nie öffentlich)
.env.example                       Vorlage für alle Secrets/Keys (kopieren zu .env)
CHECKOUT_SETUP.md                  Stripe-Preise/IDs einrichten
SELLING_LIVE_SETUP.md              Live-Deploy: Hosting, Webhook, Google, Recht
VIDEO_WORKFLOW.md                  KI-Coaching-Video-Produktion (Leitfaden)
```

## Käufer-Flow

1. Plan in den Warenkorb → Checkout → **Stripe** (echte Zahlung, sobald Keys gesetzt).
2. Stripe leitet zu `checkout-success.html?session_id=…`; der Server verifiziert die Zahlung
   (`/api/checkout/complete`) und/oder per **Webhook** und legt das Entitlement an (idempotent).
3. Käufer meldet sich mit **derselben Google-E-Mail** an (`account.html`).
4. Im Konto: „Plan öffnen" → persönlicher Link `/access/<token>` (pro Kauf einzigartig, nur für die
   Käufer-E-Mail, nur eingeloggt). Geteilte Links ohne passenden Login funktionieren nicht.

## Sicherheit (Kurz)

- Keine Secrets im Frontend/Logs. Login = signiertes HttpOnly-Cookie. Freischaltung nur serverseitig
  nach Stripe-Verifikation. Volle Pläne privat (`server/private/`), öffentliche `/products/plans/*.html|*.md`
  gesperrt. Access-Tokens werden abgeleitet (nicht im Klartext gespeichert).
- `DEV_AUTH=1` (nur lokal!) erlaubt Test-Login/-Freischaltung ohne Zahlung. Default = aus.

## Preise

Starter €9 · Gym + Ernährung €19 · Komplett-Paket €39 · Mini-Pläne €5/€4/€4/€4/€3.

## Live gehen

Siehe **[SELLING_LIVE_SETUP.md](SELLING_LIVE_SETUP.md)** (Hosting, Stripe-Webhook, Google-OAuth,
`SESSION_SECRET`, Recht) und **[CHECKOUT_SETUP.md](CHECKOUT_SETUP.md)** (Stripe-Preise).

## Hinweis

Alle Inhalte sind allgemeine Fitness-/Trainingsinformationen, keine medizinische Beratung und keine
garantierten Ergebnisse. Impressum/Datenschutz/AGB vor Live-Schaltung ergänzen.
