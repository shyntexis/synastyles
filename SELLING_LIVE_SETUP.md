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
STRIPE_COUPON_LAUNCH20=coupon_...         # optional: echte Stripe-Coupons für die Rabattcodes
STRIPE_COUPON_RESET15=coupon_...          # (siehe data/discount-codes.json + Abschnitt 3b)
STRIPE_COUPON_FRIEND10=coupon_...
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

## 3b. Rabattcodes & Newsletter (Go-Live)

**Stand 2026-07-02: Die drei Stripe-Coupons existieren im Live-Account und sind in
`data/discount-codes.json` verknüpft** (`stripeCouponId`: LAUNCH20 20 %, RESET15 15 %,
FRIEND10 10 % — Coupon-IDs identisch mit den Code-Namen). Die Codes reduzieren damit den
tatsächlich von Stripe berechneten Betrag. Eine Env-Variable (`STRIPE_COUPON_…`) ist nur
noch nötig, wenn du eine Coupon-ID übersteuern willst.

So legst du KÜNFTIGE Codes checkout-wahr an:

1. Stripe Dashboard (Live-Modus) → Produktkatalog → **Coupons** → Coupon anlegen. Der Prozentsatz
   **muss** dem `percentOff` in `data/discount-codes.json` entsprechen.
2. Coupon-ID in `data/discount-codes.json` als `stripeCouponId` eintragen (oder als Env-Variable,
   Name in `stripeCouponEnvKey`) → **redeploy**.
3. **Testkauf** mit dem Code: Der auf der Website angezeigte Betrag muss exakt dem von Stripe
   abgebuchten entsprechen. Erst danach den Code öffentlich bewerben.

Ohne verknüpften Coupon niemals einen reduzierten Endbetrag versprechen — die Seite tut das auch nicht
von selbst (sie zeigt `stripeApplied: false` und hält den regulären Preis).

**Newsletter:** `POST /api/newsletter` speichert Anmeldungen dedupliziert im JSON-Store
(`db.json` → `newsletter[]`). Dafür gilt dieselbe Persistenz-Anforderung wie in Abschnitt 1
(Render-Disk / `ZENITH_DATA_DIR`) — sonst gehen Anmeldungen **und** eingelöste Codes bei jedem
Deploy verloren. **Neu:** Jede erfolgreiche Anmeldung liefert zusätzlich einen persönlichen,
signierten Zugangslink zum kostenlosen **7-Day Gym Reset** (`freeAccess` in der API-Antwort;
funktioniert unabhängig vom Store, solange `SESSION_SECRET` stabil bleibt).

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
- **Zugangslinks** `/access/<token>`: pro Kauf/Produkt ein eigener Token, in zwei Varianten, beide
  gültig: **v1** (abgeleitet aus der Entitlement-ID, braucht einen Store-Lookup) und **v2**
  (`v2.…`-Präfix, zustandsarm — E-Mail, Produkt-ID und Session-ID stecken HMAC-signiert direkt im
  Token, ohne dass ein DB-Eintrag existieren muss). `/api/checkout/complete` vergibt seit dieser
  Version v2-Links, damit der Käuferzugang auch direkt funktioniert, wenn der JSON-Store/die Disk
  gerade erst neu gestartet ist oder (noch) nicht persistiert hat. Der Link funktioniert nach
  bestätigter Zahlung direkt ohne Google-Login, damit Käufer ihre digitalen Inhalte sofort öffnen
  können. Google-Login ist nur optionaler Konto-Komfort; rohe Plan-Dateien bleiben trotzdem gesperrt.
  Der Account-Store (`server/private/db.json` bzw. `ZENITH_DATA_DIR`) und der Stripe-**Webhook**
  bleiben trotzdem wichtig: sie treiben die Konto-Übersicht („meine Käufe"), sorgen für idempotente
  Freischaltung und liefern eine zweite, zuverlässige Bestätigungsquelle unabhängig davon, ob der
  Käufer die Success-Seite überhaupt öffnet.
- **`SESSION_SECRET` muss stabil bleiben.** Es signiert Sessions **und** beide Access-Token-Varianten
  (v1 und v2). Rotiert das Secret (z. B. neuer Zufallswert in Render gesetzt), werden alle bereits
  ausgegebenen Zugangslinks und Login-Sessions ungültig — Käufer bräuchten dann einen neuen Link
  über `/api/checkout/complete` (per Kauf-Beleg/E-Mail) oder erneuten Kauf-Support.
- **Volle Pläne** liegen in `server/private/plans/` und werden **nicht** öffentlich ausgeliefert;
  direkte Aufrufe von `/products/plans/*.html|*.md` sind gesperrt.

## 6. Rechtliches VOR dem echten Verkauf (nicht optional)

Die Seiten sind angelegt und im Footer/Checkout verlinkt:

- **Impressum** → `impressum.html`
- **Datenschutzerklärung** → `datenschutz.html` (Hosting, Stripe, optionaler Google-Login, Cookies, Logs)
- **AGB** → `agb.html`
- **Widerrufsbelehrung** → `widerruf.html` (inkl. Erlöschen des Widerrufsrechts bei digitalen Inhalten
  nach ausdrücklicher Zustimmung + Muster-Widerrufsformular)

**Noch zu tun (Pflicht vor Verkaufsstart):** Die Rechtsseiten enthalten keine Platzhalter-Marker
mehr, sondern an den betroffenen Stellen Erklärsätze bzw. bewusst unvollständige Anbieter-Blöcke
(derzeit nur Vorname + E-Mail). Vor Verkaufsstart muss der Betreiber dort seinen vollständigen
Namen und eine ladungsfähige Anschrift eintragen:

- `impressum.html`: Anbieter-Block unter „Angaben gemäß § 5 DDG" (dabei den Erklärsatz zur
  nachgereichten Anschrift ersetzen) und Block „Verantwortlich für den Inhalt nach
  § 18 Abs. 2 MStV". Außerdem den Abschnitt „Umsatzsteuer" an den eigenen Steuerstatus anpassen
  (USt-IdNr. **oder** Kleinunternehmer-Hinweis nach § 19 UStG).
- `datenschutz.html`: Abschnitt „1. Verantwortlicher".
- `agb.html`: Anbieter-Block in „§ 1 Geltungsbereich und Anbieter".
- `widerruf.html`: Adressblock unter „Widerrufsrecht" (Empfänger der Widerrufserklärung).

Es wurden bewusst **keine erfundenen Angaben** eingesetzt. Dies ist keine Rechtsberatung.

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
