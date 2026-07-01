# ZENITH — Produkt-Roadmap (Neue Produkte)

**Owner:** Tristan (Solo-Creator) · Marke: ZENITH Gym Coaching · Kanal: TikTok [@tristymindagym](https://www.tiktok.com/@tristymindagym)
**Autor:** Alex (Produkt) · **Stand:** 2026-07-01 · **Status:** Entwurf zur Umsetzung

> **Kontext:** 8 Produkte sind live (€3–€39), Auslieferung über persönlichen
> `/access/`-Zugangslink + PDF. `data/products.json` ist die **einzige Quelle der
> Wahrheit für Preise** — die bestehenden Preise werden hier nicht angefasst.
> Neu vorhanden: **Newsletter** (E-Mail-Liste) und **Rabatt-/Affiliate-Codes**
> (`data/discount-codes.json`, z. B. LAUNCH20 = 20 %, FRIEND10 = 10 %, RESET15 = 15 %).

**Bestehende Preisleiter (unverändert):** Technik-Checkliste €3 · Supplement-Guide €4 ·
Cardio Plan €4 · Schlaf & Erholung €4 · Essensplan €5 · Starter Gym Plan €9 ·
Gym + Ernährung €19 · Komplett-Paket €39.

---

## 1. Produktmatrix — Neue Kandidaten

| Produkt | Zielgruppe / Job-to-be-done | Preisidee (€) | Format / Auslieferung | Aufwand | Voraussetzungen | Priorität | Begründung |
|---|---|---|---|---|---|---|---|
| **7-Day Gym Reset** | Wiedereinsteiger & Anfänger: „Gib mir 7 Tage klare Struktur, damit ich überhaupt (wieder) anfange." | **€0 — kostenloser Newsletter-Leadmagnet** | Online-Seite + PDF, Auslieferung automatisch nach Newsletter-Anmeldung | **S** | Content schreiben (7 Tages-Einheiten), an vorhandene Newsletter-Technik koppeln. **Kein Stripe nötig.** | **P1** | Baut die E-Mail-Liste auf — der wichtigste Hebel für alle späteren Launches. Eigener Kanal statt Abhängigkeit vom TikTok-Algorithmus. Nutzt nur vorhandene Technik. |
| **Bundles + Rabattcode-Kampagnen** | Interessenten, die zögern: „Mehrere Pläne, aber günstiger im Paket." | Bestehende Preise + Code (LAUNCH20 / FRIEND10) | Bestehende Produkte + Code im Checkout; später echte Bundle-Produkte mit eigener Stripe-Price-ID | **S** | Kampagnen-Text (Newsletter + Hinweis auf der Seite). Codes existieren bereits. Für echte Bundles später: neues Stripe-Produkt + Price-ID. | **P1** | Sofort umsetzbar ohne neuen Content. Erhöht Warenkorbwert der Bestandsprodukte. Rabatt ehrlich und mit klarem Enddatum kommunizieren; vor Bewerbung den passenden Stripe-Coupon verknüpfen. |
| **Meal-Prep Cheatsheet** | Berufstätige/Studenten: „1× kochen, die Woche versorgt sein." | **4** | PDF (druckbar, Kühlschrank-tauglich) + Online-Zugangslink | **S** | Content schreiben; Stripe: neues Produkt + Price-ID anlegen, env-Var setzen, `data/products.json` ergänzen | **P1** | Kleinster bezahlter Neuzugang, passt exakt neben Essensplan (€5), hohe Mitkauf-Wahrscheinlichkeit in der Ernährungs-Linie. |
| **30-Day Challenge** | Motivierte Anfänger: „Ein Monat, ein Plan — und etwas, das mich dranbleiben lässt." | **9** | Online-Plan (4 Wochenblöcke) + **druckbarer Tracker** (1 Seite) + PDF | **M** | Content für 30 Tage strukturieren, Tracker-PDF gestalten; Stripe-Price-ID + env-Var + `products.json` | **P2** | Dranbleiben ist das echte Problem der Zielgruppe. Zeitlich begrenztes Format ist TikTok-nativ („Tag 1 meiner Challenge") und liefert 30 Tage Content-Ideen gratis mit. |
| **Home-Workout Plan** | Leute ohne Gym: „Ich will ohne Gerätepark trainieren — zuhause oder unterwegs." | **9** | Online-Plan + PDF (Körpergewicht + Minimal-Equipment) | **M** | Neue Übungsauswahl + Progressionen (kein Gym-Content wiederverwendbar); Stripe-Price-ID + env-Var + `products.json` | **P2** | Erschließt eine Zielgruppe, die der aktuelle Katalog komplett ignoriert. Kannibalisiert den Starter Plan kaum (anderer Kontext). |
| **Bulk/Cut Starter** | Fortgeschrittene Anfänger: „Ich habe ein Ziel (Masse oder Definition) und will den ehrlichen Startpunkt." | **12** | Online-Guide + PDF — beide Wege (Masse & Definition) in einem Produkt | **M** | Content mit sorgfältiger, nicht-medizinischer Formulierung (wichtigste Voraussetzung!); Stripe-Price-ID + env-Var + `products.json` | **P2** | Natürliches Folgeprodukt nach Starter / Gym + Ernährung. Schließt die Preislücke zwischen €9 und €19. |
| **Form-Checkliste als Video-Begleiter** | Käufer der €3-Technik-Checkliste: „Ich will die Cues einmal richtig sehen, nicht nur lesen." | **7** | Online-Seite mit kurzen Übungsvideos pro Grundübung + PDF; die €3-Checkliste bleibt als Einstieg bestehen | **M** | Videos drehen (Tristan), Einbettung klären; Stripe-Price-ID + env-Var + `products.json` | **P2** | Erstes Video-Produkt mit geringem Risiko und klarem Upsell-Pfad von der €3-Checkliste. Nur starten, wenn die Videoqualität stimmt. |
| **Video-Form-Check light** | Unsichere Trainierende: „Schaut jemand mit Ahnung auf MEINE Ausführung?" | **19** | **Service, manuell:** Kunde sendet 1 Übungsvideo (v1: per E-Mail nach Kauf), Tristan antwortet persönlich. **Echt limitiert** (z. B. 5 Slots/Woche) | **M–L** | Einsende-Prozess + Antwortzeit definieren, Slot-Deckel festlegen; Stripe-Price-ID + env-Var + `products.json` (Deliverable-Seite = Einsende-Anleitung). Passt NICHT in die automatische Auslieferung — bewusst manuell. | **P3** | Hoher wahrgenommener Wert, aber bezahlt wird Tristans Zeit — skaliert nicht. Die Limitierung ist real, kein Marketing-Trick. Erst bei nachgewiesener Nachfrage (Stufe 3). |
| **Community / Membership** | Stammkunden: „Ich will laufend neue Pläne, Updates und Austausch." | **7–9 / Monat** (später festlegen) | Abo: monatlich neue Inhalte + Community-Fläche (Discord/Telegram o. ä.) | **L** | Stripe **Subscriptions** (heutiger Checkout ist One-time!), Ablauf-/Kündigungslogik, laufende Content-Pipeline, Moderation | **P3** | Ehrlich: größter Umsatz-Hebel, aber auch größte Dauerverpflichtung. Ein leeres Membership schadet der Marke mehr als keins. Erst nach Warteliste + belastbarer Nachfrage. |

**Aufwands-Übersicht:** S = 7-Day Reset, Bundles/Codes, Meal-Prep Cheatsheet ·
M = 30-Day Challenge, Home-Workout, Bulk/Cut, Video-Begleiter ·
L = Video-Form-Check (Prozess), Membership (Abo-Technik + Dauerbetrieb).

---

## 2. Warum diese Reihenfolge (Funnel-Logik)

Der Funnel folgt der Kaufbereitschaft, nicht dem Wunschdenken:

1. **Leadmagnet (€0):** Der 7-Day Gym Reset holt TikTok-Zuschauer in den Newsletter,
   die noch keine Karte zücken wollen. Die E-Mail-Liste ist der einzige eigene Kanal —
   jeder spätere Launch wird damit günstiger und planbarer.
2. **Mini-Käufe (€3–€9):** Wer den Reset durchgezogen hat, vertraut der Marke.
   Cheatsheet, Mini-Pläne und Challenge sind risikoarme Erstkäufe: Der Kunde testet,
   ob ZENITH hält, was es verspricht.
3. **Komplett-Paket (€39) & größere Produkte:** Zufriedene Mini-Käufer sind die besten
   Kandidaten für Gym + Ernährung, Bulk/Cut und das Komplett-Paket. Rabattcodes
   (LAUNCH20/FRIEND10) senken die Schwelle für den Sprung nach oben — ehrlich,
   sobald der passende Stripe-Coupon verknüpft ist und der Rabatt wirklich im Checkout ankommt.
4. **Persönliches & Abo (zuletzt):** Video-Form-Check und Membership brauchen eine
   warme, aktive Liste und kosten Tristans Zeit pro Kunde. Deshalb bewusst am Ende:
   erst Liste aufbauen, dann Vertrauen verdienen, dann Zeit verkaufen.

Kurz: **Reichweite → eigene Kontakte → kleine Käufe → großer Warenkorb → laufende
Beziehung.** Jede Stufe finanziert und validiert die nächste.

---

## 3. Rollout in 3 Stufen

### Stufe 1 — Diese Woche (nur Content + vorhandene Technik)

Kein neues Stripe-Produkt, keine neuen Seitenstrukturen — nur schreiben und verdrahten:

1. **7-Day Gym Reset schreiben:** 7 kurze Tages-Einheiten im Stil der bestehenden
   Pläne (privates Plan-HTML wie die anderen Deliverables, plus PDF).
2. **Reset an den Newsletter koppeln:** Anmeldung → Zugangslink automatisch per
   E-Mail (vorhandene Newsletter-Technik). Landingpage: klarer Hinweis
   „Kostenloser 7-Day Gym Reset für Newsletter-Abonnenten".
3. **Rabattcode-Kampagne starten:** Newsletter-Mail + Hinweis auf der Seite mit
   LAUNCH20/FRIEND10 für die bestehenden Produkte. Klar benennen, was der Code
   kann und wie lange er gilt — kein künstlicher Countdown.
4. **Meal-Prep Cheatsheet vorschreiben** (Content fertig, Verkaufsstart erst in
   Stufe 2, wenn die Price-ID existiert).
5. **Messen:** Newsletter-Anmeldungen/Woche, Code-Einlösungen, Verkäufe pro Produkt.

### Stufe 2 — Nächste 2–4 Wochen (neue bezahlte Produkte + Plan-Seiten)

Reihenfolge: **Meal-Prep Cheatsheet → 30-Day Challenge → Home-Workout Plan →
Bulk/Cut Starter → Form-Video-Begleiter.** Pro Produkt derselbe Ablauf:

1. Content fertigstellen und als Plan-Seite anlegen (gleiches Muster wie die
   bestehenden Deliverables, inkl. druckbarem PDF wo sinnvoll — beim Cheatsheet
   und Challenge-Tracker ist das PDF der Kern).
2. **Stripe: neues Produkt + Price-ID anlegen, env-Var setzen
   (`STRIPE_PRICE_...`, Muster wie bestehende Produkte), `data/products.json`
   ergänzen** — `priceCents`/`priceLabel` müssen exakt dem Stripe-Preis entsprechen.
3. **Test-Checkout durchführen:** Der Betrag auf der Stripe-Seite muss dem Label
   auf der Website entsprechen. Erst danach die Produktkarte auf der Landingpage
   sichtbar machen (Warenkorb-Button mit `data-product="<id>"`).
4. Launch-Mail an die (inzwischen gewachsene) Newsletter-Liste, optional mit Code.
5. Erfolgsmarke pro Produkt: **X Verkäufe in 14 Tagen** (vorher festlegen). Wird
   sie klar verfehlt → Positionierung/Beschreibung überarbeiten, bevor das nächste
   Produkt startet.

### Stufe 3 — Erst bei nachgewiesener Nachfrage (Video-Check / Membership)

**Startbedingungen (ehrlich prüfen, nicht hoffen):** Newsletter-Liste spürbar
gewachsen (Richtwert: mehrere hundert aktive Abonnenten) UND wiederholte,
unaufgeforderte Nachfragen nach persönlichem Feedback bzw. laufender Betreuung.

1. **Video-Form-Check light zuerst** (kleiner, jederzeit stoppbar):
   - Prozess: Kauf → Bestätigungsseite erklärt die Einsendung per E-Mail →
     Tristan antwortet innerhalb einer festen Frist. Slot-Zahl pro Woche real
     begrenzen (Produkt pausieren, wenn voll).
   - **Stripe: neues Produkt + Price-ID anlegen, env-Var setzen,
     `data/products.json` ergänzen** — das „Deliverable" ist die Einsende-Anleitung.
   - Wenn die Slots 4+ Wochen in Folge ausgebucht sind → Preis oder Kapazität anpassen.
2. **Membership nur danach:**
   - Vorher als **Warteliste** testen (Newsletter-Segment „Membership-Interesse").
     Zu wenig Einträge → Idee bleibt ohne schlechtes Gewissen in der Schublade.
   - Technisch ehrlich: erfordert Stripe **Subscriptions** (der heutige Checkout ist
     auf Einmalzahlung ausgelegt), Kündigungsflow und eine Logik für „Zugang aktiv
     bis". Dazu Stripe: neues Abo-Produkt + wiederkehrende Price-ID anlegen,
     env-Var setzen, `data/products.json` bzw. Abo-Datenmodell ergänzen.
   - Betrieblich ehrlich: monatlich neue Inhalte + Moderation sind eine
     Dauerverpflichtung. Ohne Content-Pipeline kein Start.

---

## 4. Nicht-Ziele / Warnungen

| Regel | Warum |
|---|---|
| **Keine medizinischen Versprechen** — kein „heilt", kein „garantiert X kg", keine Diagnosen. Formulierungen bleiben bei Training, Struktur, Alltag. | Rechtliches Risiko + widerspricht dem ehrlichen Markenkern. Besonders kritisch bei Bulk/Cut Starter und Video-Form-Check (keine Verletzungs-/Gesundheitsdiagnosen). |
| **Keine Fake-Verknappung** — keine „nur noch 2 Stück"-PDFs, keine Countdown-Timer ohne echtes Ende. | Digitale Produkte sind nicht knapp. Einzige echte Limitierung: Video-Form-Check-Slots — und die sind real, weil Tristans Zeit real begrenzt ist. Rabattaktionen bekommen ein echtes Enddatum in den Code-Daten. |
| **Die Website darf nie Preise zeigen, die Stripe nicht wirklich verlangt.** `data/products.json` bleibt die einzige Preisquelle; Label und Stripe-Price-ID bewegen sich immer zusammen. | Ein Preis auf der Seite und ein anderer im Checkout zerstört Vertrauen sofort. Deshalb: neues Produkt erst sichtbar schalten, wenn die Price-ID existiert und ein Test-Checkout den korrekten Betrag gezeigt hat. Rabatte laufen ausschließlich über die dokumentierten Codes, nie über heimlich gesenkte Labels. |
| **Keine stillen Preisänderungen an den 8 Bestandsprodukten.** | Die Leiter €3–€39 ist etabliert und ehrlich. Änderungen nur bewusst, mit neuem Stripe-Preis UND neuem Label gleichzeitig. |
| **Kein Membership-Start ohne Content-Pipeline und Warteliste.** | Ein Abo, das nach Monat 2 leerläuft, produziert Kündigungen und Vertrauensverlust — teurer als gar kein Abo. |
| **Kein Launch ohne Messung.** Jedes neue Produkt bekommt vor dem Start eine simple Erfolgsmarke (z. B. „X Verkäufe in 14 Tagen"). | Ohne Marke wird nie aufgeräumt — und die Roadmap füllt sich mit Zombies. |
