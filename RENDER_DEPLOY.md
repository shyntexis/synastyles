# Render Deployment – ZENITH

Status: Das Repo ist vorbereitet für einen Render-Webservice. Der echte Deploy braucht Render-Login/API-Zugriff und wahrscheinlich einen bezahlten Service, weil Käuferdaten persistent gespeichert werden müssen.

## Warum kein Static-Host?

ZENITH ist jetzt ein Node-Shop mit:

- Stripe Checkout
- Google Login
- signierten Sessions
- geschützten Käuferlinks `/access/<token>`
- privatem Käufer-Store `db.json`
- privaten Plan-Inhalten unter `server/private/plans/`

Ein reiner Static-Host reicht dafür nicht.

## Render Blueprint

Datei: `render.yaml`

Einstellungen:

- Runtime: Node
- Build Command: `npm install`
- Start Command: `npm start`
- Healthcheck: `/api/checkout-status`
- Region: Frankfurt
- Persistent Disk: `/var/data`, 1 GB
- Store-Pfad: `ZENITH_DATA_DIR=/var/data`
- `DEV_AUTH=0`

Wichtig: Die Disk ist nötig, damit Käuferdaten/Entitlements nicht bei Deploys verschwinden.

## Render Env Vars

In Render müssen diese Werte gesetzt werden:

```env
PUBLIC_SITE_URL=https://<deine-render-domain-oder-domain>
SESSION_SECRET=<langer random secret>
ZENITH_DATA_DIR=/var/data
DEV_AUTH=0

STRIPE_SECRET_KEY=<Stripe secret>
STRIPE_WEBHOOK_SECRET=<nach Webhook-Erstellung>
STRIPE_PRICE_STARTER_GYM_PLAN=<price id>
STRIPE_PRICE_GYM_ERNAEHRUNG=<price id>
STRIPE_PRICE_KOMPLETT_PAKET=<price id>
STRIPE_PRICE_MINI_ESSENSPLAN=<price id>
STRIPE_PRICE_MINI_SUPPLEMENT_GUIDE=<price id>
STRIPE_PRICE_MINI_CARDIO_PLAN=<price id>
STRIPE_PRICE_MINI_SCHLAF_ERHOLUNG=<price id>
STRIPE_PRICE_MINI_TECHNIK_CHECKLISTE=<price id>

GOOGLE_CLIENT_ID=<Google OAuth client id>
GOOGLE_CLIENT_SECRET=<Google OAuth client secret>
```

## Nach Deploy

1. Render gibt eine HTTPS-URL aus.
2. `PUBLIC_SITE_URL` auf diese URL setzen.
3. Testen:
   - `/` -> 200
   - `/api/checkout-status` -> `mode: live`, `devAuth: false`
   - `/products/plans/komplett-paket.html` -> 403/blocked
4. Google OAuth erstellen:
   - Redirect URI: `https://<domain>/auth/google/callback`
5. Stripe Webhook erstellen:
   - Endpoint: `https://<domain>/api/stripe/webhook`
   - Event: `checkout.session.completed`
   - Signing Secret in `STRIPE_WEBHOOK_SECRET`
6. Rechtliches finalisieren: Impressum, Datenschutz, AGB, Widerruf digitale Inhalte.

## Sicherheitsregeln

- `.env` niemals committen.
- `server/private/db.json` niemals committen.
- `DEV_AUTH` in Produktion nie aktivieren.
- Keine echten Zahlungen im Test auslösen.
