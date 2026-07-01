# Checkout einrichten (Stripe)

Diese Seite hat einen echten Warenkorb und einen Checkout-Flow. Solange keine Stripe-Daten
hinterlegt sind, läuft alles im **Demo-/Setup-Modus**: Es wird **keine Zahlung** ausgelöst und nichts
als „bezahlt" behauptet. Sobald du Stripe-Keys + Price-IDs einträgst, erstellt der Server echte
Stripe-Checkout-Sessions.

## 1. Lokal starten

Voraussetzung: **Node 18+** (für `fetch`). Es sind **keine npm-Pakete** nötig.

```bash
cd /c/Users/Tristan/Desktop/2026-06-30_tristym-gym-coaching-site
node server/checkout-server.mjs
# oder: npm start
```

Dann öffnen: `http://127.0.0.1:5097/`

Der Server serviert die statische Seite **und** die API. (Die reine Vorschau über
`python -m http.server` zeigt den Warenkorb ebenfalls, aber der Checkout fällt dort in den
Demo-Modus, weil es keine `/api`-Routen gibt.)

## 2. Stripe-Produkte & Preise anlegen

1. Stripe-Dashboard → **Produkte** → für jeden Plan ein Produkt anlegen.
2. Pro Produkt einen **Preis** (einmalig) in EUR anlegen:
   - Starter Gym Plan → 9,00 €
   - Gym + Ernährung → 19,00 €
   - Komplett-Paket → 39,00 €
   - Essensplan → 5,00 €
   - Supplement-Guide → 4,00 €
   - Cardio Plan → 4,00 €
   - Schlaf & Erholung → 4,00 €
   - Technik-Checkliste → 3,00 €
3. Kopiere jeweils die **Price-ID** (`price_...`).

> Die Preise stehen zusätzlich in `data/products.json` (einzige Quelle der Wahrheit fürs Frontend).
> Achte darauf, dass Stripe-Preis und `priceCents` übereinstimmen.

## 3. `.env` ausfüllen

```bash
cp .env.example .env
```

Trage ein:

```
STRIPE_SECRET_KEY=<test oder live secret aus dem Stripe Dashboard>
PUBLIC_SITE_URL=http://127.0.0.1:5097
STRIPE_PRICE_STARTER_GYM_PLAN=price_...
STRIPE_PRICE_GYM_ERNAEHRUNG=price_...
STRIPE_PRICE_KOMPLETT_PAKET=price_...
STRIPE_PRICE_MINI_ESSENSPLAN=price_...
STRIPE_PRICE_MINI_SUPPLEMENT_GUIDE=price_...
STRIPE_PRICE_MINI_CARDIO_PLAN=price_...
STRIPE_PRICE_MINI_SCHLAF_ERHOLUNG=price_...
STRIPE_PRICE_MINI_TECHNIK_CHECKLISTE=price_...
```

`.env` ist in `.gitignore` und darf **nie** committet werden. Secrets bleiben serverseitig —
niemals im HTML/JS.

## 4. Testen

- Server neu starten. Beim Start steht in der Konsole `Modus: LIVE (Stripe)`, sobald Key + alle
  Price-IDs vorhanden sind.
- Plan in den Warenkorb → „Zum Checkout" → E-Mail + Haken → „Sicher bezahlen".
- Mit Stripe-**Testkarte** `4242 4242 4242 4242` (beliebiges zukünftiges Datum / CVC) bezahlen.
- Erfolg → `checkout-success.html`, Abbruch → `checkout-cancel.html`.

## 5. Was vor der echten Live-Schaltung noch fehlt

Das hier ist ein funktionierendes Gerüst, **noch kein fertiger Shop**. Vor echtem Verkauf:

- **Download-Schutz:** Aktuell sind die Plan-Dateien frei verlinkt. Im Live-Betrieb dürfen Downloads
  erst **nach bestätigter Zahlung** ausgeliefert werden — z. B. über einen **Stripe-Webhook**
  (`checkout.session.completed`), der signierte/zeitlich begrenzte Download-Links erzeugt.
- **Live-Keys** statt Test-Keys, `PUBLIC_SITE_URL` auf die echte Domain (https).
- **Rechtliches:** vollständiges Impressum, Datenschutzerklärung, AGB und **Widerrufsbelehrung**
  (bei digitalen Inhalten Hinweis zum Erlöschen des Widerrufsrechts nach Download/Zustimmung),
  Umsatzsteuer/Kleinunternehmer-Status klären.
- **Quittung/Lieferung:** Bestell-/Liefermail an den Käufer.
- Diese Seite trifft **keine** rechtliche Aussage darüber, dass diese Punkte schon erfüllt sind.

## Fitness-Hinweis

Alle Pläne sind allgemeine Trainings-/Lifestyle-Informationen, **keine medizinische Beratung** und
**keine garantierten Ergebnisse**. Der Disclaimer steht in jedem Plan.
