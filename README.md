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
data/discount-codes.json           Rabatt-/Affiliate-Codes (NICHT öffentlich — Server sperrt den Pfad mit 403)
data/video-workflow.json           Video-Pipeline-Daten
products/plans/plan.css            Öffentliches Stylesheet der Plan-Seiten
server/checkout-server.mjs         HTTP-Server: Static + alle APIs + /access-Auslieferung
server/auth.mjs                    Session-Cookies, signierte Access-/Delivery-Tokens (v1+v2), OAuth-State
server/store.mjs                   JSON-Store (users/entitlements/newsletter/redemptions) — atomar, never-crash
server/discounts.mjs               Rabattcode-Logik (/api/discount/validate + Checkout-Integration)
server/stripe.mjs                  Stripe REST (Checkout-Session, Coupons, Webhook-Verify)
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
   Die Success-Seite ruft `/api/checkout/complete` mit **Retry/Backoff** auf (5 Versuche über
   ~15-20s), falls Stripe/Render/Webhook kurz brauchen, und zeigt währenddessen klare
   Statusmeldungen. Bei Erfolg gibt es pro Produkt einen **signierten Zugangslink** (mit
   „Link kopieren"-Button) — dieser Link trägt E-Mail + Produkt-ID direkt im (HMAC-signierten)
   Token und funktioniert **ohne** Store-/Datenbank-Lookup, also auch wenn der Server/die Disk
   direkt danach neu startet. Klappt die Bestätigung nach allen Versuchen nicht, wird das ehrlich
   angezeigt (keine Freischaltung behauptet) plus ein Support-Mailto mit Session-ID.
3. Käufer kann sich optional mit Google anmelden (`account.html`), um Käufe später gebündelt im
   Konto zu sehen — für den Zugang selbst ist das nicht nötig.
4. Der Zugangslink `/access/<token>` funktioniert direkt, ohne Login, für die Käufer-E-Mail.
   Geteilte Links an Dritte öffnen zwar den Plan (kein Login-Zwang), zeigen aber sichtbar
   „Zugriff für <Käufer-E-Mail>".

## Sicherheit (Kurz)

- Keine Secrets im Frontend/Logs. Login = signiertes HttpOnly-Cookie. Freischaltung nur serverseitig
  nach Stripe-Verifikation. Volle Pläne privat (`server/private/`), öffentliche `/products/plans/*.html|*.md`
  gesperrt.
- **Access-Tokens, zwei Varianten, beide gültig:** v1 (abgeleitet aus der Entitlement-ID, braucht
  einen Store-Lookup) und v2 (`v2.…`, stateless — E-Mail/Produkt-ID/Session-ID stecken signiert im
  Token selbst). Checkout-Success vergibt jetzt v2-Links, damit der Käuferzugang auch bei einem
  JSON-Store-Reset/Render-Neustart direkt danach funktioniert. Alte v1-Links bleiben gültig.
  Der Store bleibt wichtig für Konto-Übersicht, Idempotenz und den Webhook.
- **`SESSION_SECRET` muss stabil bleiben:** Rotiert das Secret, werden alle signierten Tokens
  (Sessions, v1- **und** v2-Zugangslinks) ungültig.
- `DEV_AUTH=1` (nur lokal!) erlaubt Test-Login/-Freischaltung ohne Zahlung. Default = aus.

## Preise

Starter €9 · Gym + Ernährung €19 · Komplett-Paket €39 · Mini-Pläne €5/€4/€4/€4/€3.

## Newsletter & Rabattcodes

- **Newsletter:** `POST /api/newsletter` speichert Anmeldungen dedupliziert (normalisierte
  E-Mail, Zeitstempel) im JSON-Store (`db.json` → `newsletter[]`). Kein externer Mail-Provider
  nötig; Formular + Statusmeldungen auf der Landingpage.
- **Rabatt-/Affiliate-Codes:** in `data/discount-codes.json` (aktiv: LAUNCH20 20 %, RESET15 15 %,
  FRIEND10 10 %; CREATOR-LEA als inaktive Affiliate-Vorlage). Validierung server-seitig über
  `POST /api/discount/validate`.
- **Checkout-Wahrheit:** Ein Code senkt den bei Stripe **tatsächlich** berechneten Betrag erst,
  wenn im Stripe-Dashboard ein Coupon angelegt und dessen ID als Env-Variable
  (`STRIPE_COUPON_LAUNCH20` / `_RESET15` / `_FRIEND10`) verknüpft ist. Ohne Verknüpfung ist der
  Code nur Vorschau/Attribution — die Seite zeigt dann den regulären Preis und behauptet keinen
  Abzug. **Ablauf:** Coupon anlegen → Env setzen → Testkauf → erst dann bewerben.
  Details in [docs/backend-growth-audit.md](docs/backend-growth-audit.md).

## SEO

`robots.txt` erlaubt öffentliche Seiten und sperrt `/api/`, `/auth/`, `/access/`,
`/products/plans/`, `/server/`; verweist auf `sitemap.xml`. `sitemap.xml` listet nur die
öffentlichen, indexierbaren Seiten (`/`, `account.html`, `impressum.html`, `datenschutz.html`,
`agb.html`, `widerruf.html`) — Checkout-Success/-Cancel sind bewusst **nicht** enthalten und
tragen weiterhin `<meta name="robots" content="noindex">`. `index.html` hat Title/Description/
Canonical/OG/Twitter-Tags mit der Live-URL.

## Live gehen

Siehe **[SELLING_LIVE_SETUP.md](SELLING_LIVE_SETUP.md)** (Hosting, Stripe-Webhook, Google-OAuth,
`SESSION_SECRET`, Recht) und **[CHECKOUT_SETUP.md](CHECKOUT_SETUP.md)** (Stripe-Preise).

## Hinweis

Alle Inhalte sind allgemeine Fitness-/Trainingsinformationen, keine medizinische Beratung und keine
garantierten Ergebnisse. Impressum/Datenschutz/AGB vor Live-Schaltung ergänzen.
