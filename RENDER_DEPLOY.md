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

Live-Domain dieses Projekts: **https://zenith-gym-coaching-site.onrender.com**

1. Render gibt eine HTTPS-URL aus (hier: `https://zenith-gym-coaching-site.onrender.com`).
2. `PUBLIC_SITE_URL` auf diese URL setzen.
3. Testen:
   - `/` -> 200
   - `/api/checkout-status` -> `mode: live`, `devAuth: false`, `webhookConfigured: true`
   - `/products/plans/komplett-paket.html` -> 403/blocked
4. Stripe Webhook einrichten (exakt): siehe Abschnitt **Stripe Webhook (Schritt für Schritt)** unten.
5. Google OAuth (optional) erstellen:
   - Redirect URI: `https://zenith-gym-coaching-site.onrender.com/auth/google/callback`
   - Google-Login ist **optional** (nur Konto-Komfort). Käufe funktionieren ohne Login über den
     persönlichen Zugangslink nach der Zahlung.
6. Rechtliches finalisieren: In `impressum.html`, `datenschutz.html`, `agb.html`, `widerruf.html` die
   als „BITTE ERGÄNZEN" markierten Pflichtfelder (Name, Anschrift, Steuerstatus) mit echten Daten füllen.

## Stripe Webhook (Schritt für Schritt)

Der Webhook ist die zuverlässige Freischaltungsquelle (`checkout.session.completed` → `store.fulfillSession`),
auch wenn der Käufer die Success-Seite nie öffnet.

1. Stripe Dashboard (Live-Modus!) → **Entwickler → Webhooks → Endpoint hinzufügen**.
2. Endpoint-URL exakt: `https://zenith-gym-coaching-site.onrender.com/api/stripe/webhook`
3. Zu sendende Events: **`checkout.session.completed`** auswählen.
4. Endpoint speichern, dann das **Signing Secret** (`whsec_…`) kopieren.
5. In Render unter **Environment** die Variable `STRIPE_WEBHOOK_SECRET` = dieses Signing Secret setzen.
6. **Redeploy** auslösen (Manual Deploy), damit der Server die neue Env-Variable lädt.
7. Prüfen: `/api/checkout-status` zeigt `webhookConfigured: true`. In Stripe kann ein Test-Event
   „Send test webhook" gesendet werden → sollte `200 {received:true}` liefern.

Ohne `STRIPE_WEBHOOK_SECRET` ist die Route bewusst deaktiviert (kein Crash, HTTP 400); die Freischaltung
läuft dann nur über `/api/checkout/complete` beim Aufruf der Success-Seite. Für echten Verkauf den Webhook
setzen. Das Signing Secret niemals ins Repo committen.

## Sicherheitsregeln

- `.env` niemals committen.
- `server/private/db.json` niemals committen.
- `DEV_AUTH` in Produktion nie aktivieren.
- Keine echten Zahlungen im Test auslösen.
