# ZENITH — Backend Growth Audit

Stand: 2026-07-01. Fokus: Newsletter-, Rabatt-/Affiliate-Grundlage und Checkout-Wahrheit,
umgesetzt **ohne neue externe Dependencies** (weiterhin reines Node ≥18, zero-deps).

---

## 1. Was in dieser Runde neu ist

### Newsletter (`POST /api/newsletter`)
- Nimmt `{ email, source?, interest? }`, validiert die E-Mail defensiv (nie 500 bei Tippfehler),
  speichert dedupliziert (normalisierte E-Mail) im JSON-Store (`db.json` → `newsletter[]`)
  mit `source`, optionalem `interest` und Zeitstempeln.
- Kein externer Mail-Provider nötig. Antwort ist immer sauberes JSON (`{ ok, already, message }`).
- Frontend: eigener Newsletter-Abschnitt auf der Landingpage mit Status-Feedback; fällt bei
  statischer Vorschau (kein Server) ehrlich auf einen Hinweis zurück.

### Rabatt-/Promo-/Affiliate-Codes
- **Config:** `data/discount-codes.json` — einfach editierbar. Felder pro Code:
  `code, active, percentOff, amountOffCents, campaignName, affiliateName, source,
  startsAt, endsAt, maxRedemptions, minSubtotalCents, appliesToProductIds,
  stripeCouponId, stripeCouponEnvKey`.
- **Logik:** `server/discounts.mjs` (eigenes, testbares Modul, zero-deps). Kaputte/fehlende
  Config ⇒ leere Liste ⇒ Checkout kann nie crashen, Codes matchen einfach nicht mehr.
- **Validierung:** `POST /api/discount/validate` mit `{ items, code }` gibt eine
  **client-sichere** Vorschau zurück (`discountCents`, `newTotalCents`, Labels,
  `stripeApplied`) — die aufgelöste Stripe-Coupon-ID wird nie an den Browser geleakt.
- **Checkout-Integration:** `/api/create-checkout-session` nimmt jetzt `code` an,
  validiert serverseitig (autoritativ) und schreibt `discount_code`, `affiliate`,
  `discount_source`, `discount_applied` in die Stripe-Session-Metadaten.
- **Attribution:** eingelöste Codes werden bei `checkout.session.completed` (Webhook)
  und beim `/api/checkout/complete` idempotent pro Session im Store gezählt
  (`discountRedemptions{}`), inkl. Affiliate-Name/Source.
- **Schutz:** `data/discount-codes.json` wird **nicht** öffentlich ausgeliefert
  (Server blockt den Pfad mit 403), damit Codes/Affiliates nicht enumerierbar sind.

### Stripe (`server/stripe.mjs`)
- `createCheckoutSession` unterstützt jetzt sicher: `couponId` (echter Rabatt),
  `allowPromotionCodes` (Stripe-eigene Promo-Box) und zusätzliche `metadata`.
- Standard bei Live-Checkout ohne verknüpften Coupon: `allow_promotion_codes=true`,
  d. h. Käufer können jederzeit einen in Stripe angelegten Promotion-Code eingeben.

---

## 2. Checkout-Wahrheit (die wichtigste Regel)

> Die Website darf **niemals** einen niedrigeren Preis versprechen, als Stripe wirklich verlangt.

Umsetzung:
- Ein Rabatt reduziert den **tatsächlich** von Stripe berechneten Betrag nur, wenn ein
  echter Stripe-Coupon verknüpft ist (`stripeCouponId` literal **oder** über
  `stripeCouponEnvKey` aus einer Env-Variable). Dann setzt der Server
  `discounts[0][coupon]` und Stripe rechnet exakt den angezeigten Betrag ab.
- Ohne verknüpften Coupon ist der Code **Vorschau/Marketing** (`stripeApplied:false`).
  Der Server fälscht **keinen** niedrigeren Betrag; es wird der reguläre Preis berechnet.
  Das Frontend zeigt den regulären Gesamtbetrag und einen ehrlichen Hinweis
  („Code vorgemerkt … aktuell wird der reguläre Preis berechnet“).
- Stripe verbietet `discounts` + `allow_promotion_codes` gleichzeitig → der Server nutzt
  entweder den expliziten Coupon **oder** die Promo-Box, nie beides.

### So aktivierst du einen echten Rabatt (manueller Stripe-Schritt)
1. Im Stripe-Dashboard einen **Coupon** anlegen (z. B. 20 % off).
2. Dessen ID (`coupon_XXX`) entweder direkt in `data/discount-codes.json` unter
   `stripeCouponId` eintragen **oder** als Env-Variable hinterlegen, deren Name in
   `stripeCouponEnvKey` steht (Default-Namen: `STRIPE_COUPON_LAUNCH20`,
   `STRIPE_COUPON_RESET15`, `STRIPE_COUPON_FRIEND10`).
3. Danach ist `stripeApplied:true` und der angezeigte Rabatt = der von Stripe berechnete.

> Alternativ zu Codes: Um einen **Listenpreis** dauerhaft zu senken, müssen sowohl
> `priceCents`/`priceLabel` in `data/products.json` **als auch** eine passende neue
> Stripe-Price-ID geändert werden — sonst mismatcht der Checkout. Nur das Label zu
> ändern ist ausdrücklich verboten.

---

## 3. Robustheit / Sicherheit

- Alle neuen Endpunkte: try/catch, **nie 500** bei normalen Userfehlern (falsche E-Mail,
  ungültiger Code, leerer Warenkorb → sauberes `{ ok:false, message }`).
- JSON-Configs werden defensiv geparst und fallbacken (leere Liste / Default).
- Store-Schreibzugriffe bleiben atomar (temp→rename) und serialisiert (Mutex).
- `server/private/*` und `data/discount-codes.json` sind nicht öffentlich; bestehende
  Käufer-Zugänge (signierte v2-Delivery-Tokens) und Plan-Protection unverändert.
- Getestet in der Umsetzungs-Session mit Ad-hoc-Skripten (Rabatt-Mathe, Dedupe, Idempotenz;
  HTTP-Checks für Endpunkte, Demo-Modus und 403-Blocks inkl. Path-Bypass-Versuchen) — alle grün,
  ohne echte Zahlung. Die Skripte liegen aktuell nicht im Repo (kein `npm test`); ein nächster
  Schritt ist, sie als committete Suite (`tools/checks/*.test.mjs`, `node --test`) zu hinterlegen.

---

## 4. Nächste große Schritte (Roadmap)

| Priorität | Thema | Nutzen | Aufwand |
|-----------|-------|--------|---------|
| Hoch | **Persistenter Datenträger** (Render Disk, `ZENITH_DATA_DIR`) | Newsletter/Redemptions/Entitlements überleben Deploys | S (Config) |
| Hoch | **Rate-Limiting / Anti-Abuse** auf `/api/newsletter` & `/api/discount/validate` | Schutz vor Spam & Code-Enumeration | S–M |
| Hoch | **Double-Opt-in + echter Mailversand** (Resend ist bereits optional integriert) | DSGVO-sichere, nutzbare Mailliste | M |
| Mittel | **Admin-Panel für Codes** (geschützte Route, Token-Login) | Codes/Kampagnen ohne Datei-Edit verwalten | M |
| Mittel | **Analytics / Funnel-Events** (add-to-cart, checkout-start, purchase, code-redemption) | Conversion messbar machen | M |
| Mittel | **Webhook-Persistenz härten** (Retry-sichere Idempotenz vorhanden, Logging ergänzen) | verlässliche Fulfillment-Historie | S |
| Niedrig | **A/B-Testing** (Preis-/Copy-Varianten serverseitig ausspielen) | datengetriebene Optimierung | M–L |
| Niedrig | **Affiliate-Dashboard/Export** (Redemptions je `CREATOR-<NAME>` auswerten) | Creator-Abrechnung | M |

---

## 5. Betroffene Dateien (diese Runde)

- Neu: `data/discount-codes.json`, `server/discounts.mjs`, `docs/backend-growth-audit.md`.
- Erweitert: `server/store.mjs` (Newsletter + Redemptions), `server/stripe.mjs`
  (Coupon/Promo/Metadata), `server/checkout-server.mjs` (2 neue Endpunkte, Discount-
  Integration, 403-Block), `index.html`, `app.js`, `styles.css` (Newsletter, Code-Feld,
  Trust/FAQ/Roadmap-Sektionen).
