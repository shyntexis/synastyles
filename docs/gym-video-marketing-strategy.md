# ZENITH – Video-Marketing-Strategie (TikTok-first)

Stand: Juli 2026. Alle Tool-Preise sind Momentaufnahmen und können abweichen.
Marke: **ZENITH** (deutsche Gym-Pläne als Sofort-Download/Online-Zugang).
Kanal: TikTok (Handle nur im Profil – im Content ist die Marke immer ZENITH).
Zielgruppe: deutschsprachige Gym-Anfänger und Wiedereinsteiger, 16–35.

Tonregeln (gelten für JEDES Video):
- Ehrlich, gym-nah, deutsch, kein Hype.
- Keine medizinischen Versprechen, keine Ergebnis-Claims ("X kg in Y Wochen" ist verboten).
- Keine Viral-Garantien, keine Fake-Transformationen.
- Preis darf genannt werden – die Pläne sind günstig, das ist ein ehrliches Argument.

---

## 1. Ziel & Funnel-Überblick

**Ziel:** Aus kurzen, ehrlichen Gym-Videos planbare Verkäufe der ZENITH-Pläne machen – ohne Werbebudget, mit 1 Person Produktionskapazität.

### Funnel

```
Kurzvideo (TikTok)
   │  Hook + ehrlicher Mehrwert
   ▼
Profil (Bio-Link)
   │  klare Bio: "Gym-Pläne ab 3 € – Link unten"
   ▼
Landingpage (Stripe-Checkout)
   ├── Direktkauf ──────────────► persönlicher Zugangslink nach Kauf
   └── Newsletter-Anmeldung ───► E-Mail-Strecke ► späterer Kauf
```

### Rolle der Rabattcodes im Funnel

Die Codes existieren bereits in `data/discount-codes.json`, die Eingabe im Checkout ist live. Einlösungen werden pro Code/Quelle gezählt – das ist unsere Attributionsbasis.

| Code | Rabatt | Zweck im Funnel |
|---|---|---|
| `LAUNCH20` | 20 % | Launch-Code für alle. Standard-CTA in eigenen Videos. Senkt die Kaufhürde UND misst, wie viele Käufe aus TikTok kommen. |
| `FRIEND10` | 10 % | Für Freunde-/Creator-Empfehlungen. Wird nicht öffentlich gepusht, sondern persönlich weitergegeben – fühlt sich wie ein echter Freundschafts-Deal an. |
| `RESET15` | 15 % | Dankeschön-Code für Newsletter-Abonnenten (Welcome-Mail, Reset-Serie). Macht den Newsletter selbst zum Verkaufskanal. |
| Creator-Codes (z. B. nach der Vorlage `CREATOR-LEA`) | individuell | Affiliate-Attribution: jeder Creator bekommt einen eigenen Code nach demselben Muster; Einlösungen pro Code = messbare Provision (Abschnitt 4). |

> **Checkout-Wahrheit (wichtig, vor dem Bewerben prüfen):** Ein Code senkt den tatsächlich abgebuchten Stripe-Betrag nur, wenn im Stripe-Dashboard ein passender Coupon angelegt und über die env-Variable (z. B. `STRIPE_COUPON_LAUNCH20`) verknüpft ist. Ohne diese Stripe-Verknüpfung ist der Code nur Attribution/Vorschau. Vorher gilt: Code niemals in Videos bewerben. Ablauf: Stripe-Coupon anlegen → env setzen → Testkauf machen → erst dann posten.

**Warum Codes statt Tracking-Pixel:** TikTok-Bio-Links sind schwer sauber zu tracken. Ein Code im Checkout ist die ehrlichste Attributionsquelle, die wir haben – jede Einlösung sagt uns, welches Video bzw. welcher Creator den Kauf gebracht hat.

### Produkt-Übersicht (für CTAs)

| Produkt | Preis |
|---|---|
| Starter Gym Plan | 9 € |
| Gym + Ernährung | 19 € |
| Komplett-Paket | 39 € |
| Essensplan (Mini) | 5 € |
| Supplement-Guide (Mini) | 4 € |
| Cardio Plan (Mini) | 4 € |
| Schlaf & Erholung (Mini) | 4 € |
| Technik-Checkliste (Mini) | 3 € |

---

## 2. Zehn konkrete Videoideen

Formate-Mix: 3× Fehler/Aufklärung, 2× Plan-Einblick (Screenrecording), 2× persönliche Story/POV, 1× Mythos-Check, 1× "Was kostet …", 1× Newsletter-Leadmagnet.
Standard für alle: 9:16 Hochformat, 15–30 s, Untertitel Pflicht, Hook gesprochen UND als Text-Overlay in Sekunde 0–2.

---

### Video 1 (Fehler/Aufklärung): "Die 3 Anfängerfehler, die dich Monate kosten"

**Hook (0–2 s):** "Wenn du neu im Gym bist, machst du gerade wahrscheinlich Fehler Nummer 2."

**Script (ca. 25 s):**
- 0–2 s: Hook als Text-Overlay + gesprochen.
- 2–8 s: Fehler 1: jede Woche einen neuen Plan ausprobieren.
- 8–15 s: Fehler 2: zu viel Gewicht, keine saubere Technik.
- 15–21 s: Fehler 3: kein Tracking – du weißt nicht, ob du stärker wirst.
- 21–25 s: CTA-Karte einblenden.

**Voiceover (sprechfertig):**
"Wenn du neu im Gym bist, machst du gerade wahrscheinlich Fehler Nummer 2. Fehler eins: Du wechselst jede Woche den Plan. Dein Körper braucht Wiederholung, nicht Abwechslung. Fehler zwei: zu viel Gewicht. Wenn deine Technik leidet, trainierst du an deinen Muskeln vorbei. Fehler drei: Du schreibst nichts auf. Ohne Tracking weißt du nicht, ob du dich verbesserst. Genau dafür hab ich den Starter Gym Plan gebaut – neun Euro, sofort runterladen. Mit Code LAUNCH20 nochmal zwanzig Prozent günstiger. Link im Profil."

**B-Roll / Avatar / AI-Human-Prompt:**
- Selbst gefilmt (Handy, 9:16): 1) jemand scrollt ratlos am Handy zwischen Geräten, 2) wacklige Wiederholung mit zu viel Gewicht (gestellt, sicher!), 3) Notizbuch/App mit Trainingslog.
- Avatar-Alternative (HeyGen/Argil): "Junger Mann, Mitte 20, schlichtes schwarzes T-Shirt, steht in einem modernen Fitnessstudio vor einem Hantelregal, spricht direkt und ruhig in die Kamera, Handy-Video-Look, natürliches Licht, Hochformat 9:16." B-Roll-Cutaways trotzdem selbst filmen.

**CTA + Code:** "Starter Gym Plan, 9 € – Code `LAUNCH20`, Link im Profil."

---

### Video 2 (Fehler/Aufklärung): "4× die Woche trainieren und trotzdem kein Fortschritt?"

**Hook (0–2 s):** "Du gehst viermal die Woche ins Gym und siehst trotzdem nichts? Dann fehlt dir wahrscheinlich das hier."

**Script (ca. 30 s):**
- 0–2 s: Hook.
- 2–10 s: Grund 1: keine Progression (immer gleiche Gewichte/Wiederholungen).
- 10–18 s: Grund 2: Ernährung passt nicht zum Ziel – Training allein reicht selten.
- 18–25 s: Grund 3: zu wenig Erholung/Schlaf.
- 25–30 s: Lösung + CTA.

**Voiceover (sprechfertig):**
"Du gehst viermal die Woche ins Gym und siehst trotzdem nichts? Dann fehlt dir wahrscheinlich das hier. Erstens: Progression. Wenn du seit Monaten dieselben Gewichte bewegst, hat dein Körper keinen Grund, sich anzupassen. Zweitens: Ernährung. Training ist der Reiz, aber gebaut wird in der Küche. Drittens: Erholung. Wer dauerhaft schlecht schläft, verschenkt Fortschritt. Im Paket Gym plus Ernährung bekommst du Trainings- und Essensstruktur zusammen – neunzehn Euro. Code LAUNCH20 spart dir zwanzig Prozent. Link im Profil."

**B-Roll / Avatar / AI-Human-Prompt:**
- Selbst gefilmt: Langhantel beim Scheiben-Auflegen (Progression visualisieren), einfache Meal-Prep-Box, jemand schaut müde aufs Handy im Bett (gestellt).
- Avatar-Alternative: gleicher ZENITH-Avatar wie Video 1 (Konsistenz), Prompt-Zusatz: "sitzt auf einer Hantelbank, leicht vorgebeugt, erklärender Gestus, ruhige Energie."

**CTA + Code:** "Gym + Ernährung, 19 € – Code `LAUNCH20`."

---

### Video 3 (Fehler/Aufklärung): "Leg das Gewicht runter"

**Hook (0–2 s):** "Leg das Gewicht runter. Ernsthaft. Ich erklär dir, warum."

**Script (ca. 20 s):**
- 0–2 s: Hook (direkt in die Kamera).
- 2–9 s: Ego-Lifting erklärt: halbe Bewegungen, Schwung, keine Kontrolle.
- 9–16 s: Was stattdessen: volle Bewegungsamplitude, kontrolliertes Tempo, dann erst Gewicht steigern.
- 16–20 s: CTA Technik-Checkliste.

**Voiceover (sprechfertig):**
"Leg das Gewicht runter. Ernsthaft. Ich erklär dir, warum. Halbe Wiederholungen mit Schwung sehen stark aus, bringen dir aber wenig – und dein Verletzungsrisiko steigt. Mach die Übung sauber über die volle Bewegung, kontrolliert runter, kontrolliert hoch. Erst wenn das sitzt, kommt mehr Gewicht drauf. Ich hab dafür eine Technik-Checkliste für die wichtigsten Grundübungen gemacht – drei Euro, sofort auf dem Handy. Link im Profil."

**B-Roll / Avatar / AI-Human-Prompt:**
- Selbst gefilmt, Split-Screen: links überhastete Wiederholung (gestellt, leichtes Gewicht), rechts dieselbe Übung sauber und langsam. Nahaufnahme Hände an der Stange.
- Avatar-Alternative: für dieses Video NICHT empfohlen – der Kontrast lebt von echter Übungsausführung.

**CTA + Code:** "Technik-Checkliste, 3 € – Code `LAUNCH20`, Link im Profil."

---

### Video 4 (Plan-Einblick, Screenrecording): "So sieht ein 9-€-Plan von innen aus"

**Hook (0–2 s):** "Das hier bekommst du für neun Euro – ich zeig dir einfach mal alles."

**Script (ca. 30 s):**
- 0–2 s: Hook + Screenrecording startet (Landingpage → Plan öffnet sich).
- 2–10 s: Scroll durch die Wochenstruktur (Trainingstage, Übungen, Sätze/Wiederholungen).
- 10–18 s: Zoom auf ein Detail: Ausführungshinweise + Progressionslogik.
- 18–25 s: Zeigen, wie der persönliche Zugangslink nach dem Kauf funktioniert (Sofort-Zugang, kein Abo).
- 25–30 s: CTA.

**Voiceover (sprechfertig):**
"Das hier bekommst du für neun Euro – ich zeig dir einfach mal alles. Das ist der Starter Gym Plan: klare Wochenstruktur, jede Übung mit Sätzen, Wiederholungen und Ausführungshinweisen. Hier steht auch genau, wann du das Gewicht steigerst – damit du nicht raten musst. Nach dem Kauf bekommst du sofort deinen persönlichen Zugangslink. Kein Abo, keine App-Pflicht. Neun Euro, mit Code LAUNCH20 nochmal zwanzig Prozent runter. Link im Profil."

**B-Roll / Avatar / AI-Human-Prompt:**
- Screenrecording (Handy oder Desktop-Ausschnitt im Hochformat): langsam und ruhig durch den schön gestalteten Plan scrollen, an 2 Stellen reinzoomen. Kein Avatar nötig – das Produkt IST das Visual.
- Optional 2 s Gym-B-Roll als Intro-Frame.

**CTA + Code:** "Starter Gym Plan, 9 € – Code `LAUNCH20`."

---

### Video 5 (Plan-Einblick, Screenrecording): "Was im 19-€-Paket wirklich drin ist"

**Hook (0–2 s):** "Bevor du das kaufst, schau erst rein – ich zeig dir das komplette Paket."

**Script (ca. 30 s):**
- 0–2 s: Hook.
- 2–12 s: Screenrecording Trainingsteil (wie Video 4, kürzer).
- 12–22 s: Screenrecording Ernährungsteil: Essensstruktur, Beispieltage, Einkaufsliste.
- 22–27 s: Ehrliche Einordnung: für wen es passt (Anfänger/Wiedereinsteiger) – und für wen nicht (Fortgeschrittene mit Wettkampfambitionen).
- 27–30 s: CTA.

**Voiceover (sprechfertig):**
"Bevor du das kaufst, schau erst rein – ich zeig dir das komplette Paket. Teil eins: der Trainingsplan, gleiche Struktur wie im Starter-Plan. Teil zwei: die Ernährung. Beispieltage, einfache Rezepte, Einkaufsliste – nichts mit exotischen Zutaten. Ehrlich gesagt: Wenn du schon Jahre trainierst, brauchst du das nicht. Wenn du anfängst oder wieder einsteigst, nimmt es dir das Rätselraten ab. Neunzehn Euro, Code LAUNCH20 gibt zwanzig Prozent. Link im Profil."

**B-Roll / Avatar / AI-Human-Prompt:**
- Screenrecording wie Video 4. Zusätzlich 2–3 s selbst gefilmtes B-Roll: einfache Mahlzeit wird angerichtet (Reis, Gemüse, Protein – bewusst unspektakulär, passt zum ehrlichen Ton).

**CTA + Code:** "Gym + Ernährung, 19 € – Code `LAUNCH20`."

---

### Video 6 (POV/Story): "Mein erster Tag im Gym"

**Hook (0–2 s):** "POV: Dein erster Tag im Gym – und du hast keine Ahnung, wo du anfangen sollst."

**Script (ca. 25 s):**
- 0–2 s: Hook, Kamera geht durch die Gym-Tür (POV).
- 2–10 s: POV-Bilder: volle Geräte, Leute, die wissen, was sie tun, man selbst steht rum.
- 10–18 s: Wendepunkt: "Was mir damals geholfen hätte: ein Plan, der mir einfach sagt, was ich heute mache."
- 18–25 s: CTA, ruhig gesprochen.

**Voiceover (sprechfertig):**
"Dein erster Tag im Gym. Alle scheinen zu wissen, was sie tun – nur du nicht. Du läufst einmal durch, traust dich an zwei Geräte und gehst nach zwanzig Minuten wieder. Kenn ich. Genau so war mein Anfang auch. Was mir damals geholfen hätte: ein Plan, der mir einfach sagt, was ich heute mache. Deshalb gibt es den Starter Gym Plan – neun Euro, für genau diesen ersten Monat. Code LAUNCH20, Link im Profil."

**B-Roll / Avatar / AI-Human-Prompt:**
- Selbst gefilmt (POV, Handy vor der Brust oder Kopfhöhe): Gym-Eingang, Blick über die Trainingsfläche, zögerliches Stehen vor einem Gerät. Authentizität schlägt Perfektion – leicht wacklig ist hier richtig.
- Avatar-Alternative: NICHT empfohlen. POV-Formate leben von echter Ich-Perspektive; ein KI-Avatar wirkt hier unglaubwürdig.

**CTA + Code:** "Starter Gym Plan, 9 € – Code `LAUNCH20`."

---

### Video 7 (Story): "Warum ich ZENITH gebaut habe"

**Hook (0–2 s):** "Ich hab ZENITH gebaut, weil mich Fitness-Content genervt hat. Klingt komisch, ist aber so."

**Script (ca. 30 s):**
- 0–2 s: Hook, direkt in die Kamera.
- 2–12 s: Problem: hundert Meinungen, teure Coachings, Abo-Apps – Anfänger sind überfordert.
- 12–22 s: Lösung: einfache deutsche Pläne, einmal zahlen, sofort loslegen. Preise transparent nennen.
- 22–30 s: Ehrlicher Abschluss + CTA Newsletter ODER Kauf.

**Voiceover (sprechfertig):**
"Ich hab ZENITH gebaut, weil mich Fitness-Content genervt hat. Klingt komisch, ist aber so. Überall hundert Meinungen, teure Coachings, Apps mit Abofalle. Dabei brauchen die meisten am Anfang nur eins: einen klaren Plan auf Deutsch. Deshalb: einmal zahlen, sofort runterladen, loslegen. Der kleinste Plan kostet drei Euro, das größte Paket neununddreißig. Kein Abo. Wenn du erst mal reinschauen willst: Newsletter im Link, da gibt's jede Woche einen ehrlichen Tipp. Und wenn du direkt startest: Code LAUNCH20."

**B-Roll / Avatar / AI-Human-Prompt:**
- Selbst gefilmt: Talking Head am Schreibtisch oder auf der Hantelbank, dazwischen 2–3 Cutaways: Laptop mit der ZENITH-Landingpage, Notizen/Skizzen der Pläne.
- Avatar-Alternative: nur mit eigenem geklonten Avatar (HeyGen-/Argil-Selbstklon) vertretbar – eine Gründer-Story von einem Stock-Avatar wirkt unehrlich und schadet der Marke.

**CTA + Code:** "Newsletter im Profil-Link – oder direkt starten mit Code `LAUNCH20`."

---

### Video 8 (Mythos-Check): "Ohne Supplements kein Muskelaufbau?"

**Hook (0–2 s):** "Ohne Supplements kein Muskelaufbau? Lass uns das kurz ehrlich durchgehen."

**Script (ca. 30 s):**
- 0–2 s: Hook.
- 2–12 s: Einordnung: Training, Ernährung und Schlaf sind die Basis – Supplements sind maximal das i-Tüpfelchen.
- 12–22 s: Ehrlich bleiben: manche Ergänzungen können ihren Platz haben, vieles im Regal ist aber rausgeworfenes Geld. Keine Heilsversprechen.
- 22–30 s: CTA Supplement-Guide.

**Voiceover (sprechfertig):**
"Ohne Supplements kein Muskelaufbau? Lass uns das kurz ehrlich durchgehen. Die Basis ist immer gleich: sinnvoll trainieren, genug essen, genug schlafen. Wenn das nicht steht, rettet dich kein Pulver. Ein paar Ergänzungen können ihren Platz haben – aber ein großer Teil vom Supplement-Regal ist ehrlich gesagt Geldverschwendung. Damit du nicht raten musst, was sinnvoll ist: Im Supplement-Guide gehe ich das nüchtern durch. Vier Euro, ohne Verkaufsdruck von irgendeiner Pulver-Marke. Link im Profil, Code LAUNCH20."

**B-Roll / Avatar / AI-Human-Prompt:**
- Selbst gefilmt: Kamerafahrt am Supplement-Regal (Drogerie/Shop) entlang, Shaker auf der Hantelbank, Kontrastbild: normaler Teller mit echtem Essen.
- Avatar-Alternative: möglich (Talking-Head-Aufklärung funktioniert mit Avatar). Prompt wie Video 1, Zusatz: "hält kurz einen Shaker hoch, stellt ihn dann bewusst zur Seite."

**CTA + Code:** "Supplement-Guide, 4 € – Code `LAUNCH20`."

---

### Video 9 ("Was kostet …"): "Was kostet ein Trainingsplan wirklich?"

**Hook (0–2 s):** "Was kostet ein Trainingsplan? Ich hab's ausgerechnet – die Spanne ist absurd."

**Script (ca. 30 s):**
- 0–2 s: Hook.
- 2–10 s: Personal Training: oft 50–100 € pro Stunde (Richtwert, regional unterschiedlich).
- 10–17 s: Online-Coachings: häufig dreistellig pro Monat. Abo-Apps: kleiner Monatsbetrag, läuft aber ewig weiter.
- 17–25 s: ZENITH-Einordnung: 3–39 €, einmal zahlen. Ehrlich sagen, was es NICHT ist (kein 1:1-Coaching).
- 25–30 s: CTA.

**Voiceover (sprechfertig):**
"Was kostet ein Trainingsplan? Ich hab's ausgerechnet – die Spanne ist absurd. Personal Training: je nach Stadt oft fünfzig bis hundert Euro pro Stunde. Online-Coachings: gerne mal ein paar hundert Euro im Monat. Abo-Apps: klingt günstig, läuft aber jahrelang weiter. Bei ZENITH zahlst du einmal: drei Euro für die Technik-Checkliste, neun für den Starter-Plan, neununddreißig fürs Komplett-Paket. Ganz ehrlich: Das ersetzt kein Eins-zu-eins-Coaching. Aber für den Start brauchst du das auch nicht. Code LAUNCH20, Link im Profil."

**B-Roll / Avatar / AI-Human-Prompt:**
- Visual: einfache Preis-Balken als Text-Overlays in CapCut, dazwischen Gym-B-Roll. Abschluss: Screenrecording der ZENITH-Preisübersicht auf der Landingpage.
- Avatar-Alternative: gut geeignet (reines Erklärformat). Prompt wie Video 1, aber neutraler Hintergrund, damit die Preis-Overlays wirken.

**CTA + Code:** "Pläne ab 3 € – Code `LAUNCH20`, Link im Profil."

---

### Video 10 (Newsletter-Leadmagnet): "Der eine Gym-Tipp pro Woche"

**Hook (0–2 s):** "Du musst nichts kaufen. Ich schick dir trotzdem jede Woche einen Gym-Tipp, der dich weiterbringt."

**Script (ca. 20 s):**
- 0–2 s: Hook.
- 2–10 s: Was der Newsletter ist: 1 E-Mail pro Woche, 1 konkreter Tipp, kein Spam, jederzeit abbestellbar.
- 10–16 s: Empfehlung: kleines Gratis-Extra für Anmelder anbieten (z. B. Mini-PDF "Deine erste Gym-Woche" – muss noch erstellt werden; bewusst KEIN bestehendes Bezahlprodukt verschenken).
- 16–20 s: CTA Newsletter.

**Voiceover (sprechfertig):**
"Du musst nichts kaufen. Ich schick dir trotzdem jede Woche einen Gym-Tipp, der dich weiterbringt. Eine E-Mail pro Woche, ein konkreter Tipp – Technik, Ernährung oder Planung. Kein Spam, abbestellen geht jederzeit mit einem Klick. Als Dankeschön bekommst du direkt nach der Anmeldung einen kleinen Startguide von mir. Die Anmeldung dauert dreißig Sekunden, Link im Profil."

**B-Roll / Avatar / AI-Human-Prompt:**
- Screenrecording: die Newsletter-Anmeldung auf der Landingpage in Echtzeit durchklicken (zeigt, wie schnell es geht). Dazu 2–3 s B-Roll: Handy mit geöffneter E-Mail.
- Avatar-Alternative: möglich, aber eigene Stimme wirkt hier vertrauensbildender – es geht um eine persönliche E-Mail-Beziehung.

**CTA + Code:** "Newsletter im Profil-Link – kostet nichts, kein Code nötig." (In der Welcome-Mail dann `RESET15` (15 %) als Dankeschön platzieren – so wird der Newsletter selbst zum Verkaufskanal.)

---

## 3. Produktions-Workflow "Stimme + KI-Mensch"

Ehrliche Einordnung vorweg: Für diese Marke (persönlich, gym-nah, ehrlich) ist **Variante A die beste**. B und C sind Skalierungs-Optionen, wenn Zeit knapp wird – nicht der Startpunkt.

### Variante A – Eigene Stimme, Handy + CapCut (kostenlos)

Budget: 0 €. Reicht für alle Videos in Abschnitt 2.

1. **Script schreiben** (10 Min): Voiceover-Text aus dieser Datei nehmen oder nach demselben Muster schreiben (Hook → 3 Punkte → CTA). Laut vorlesen und alles streichen, was man nicht natürlich sagen würde.
2. **Voiceover aufnehmen** (10 Min): Handy-Sprachmemo oder direkt in CapCut, ruhiger Raum (Kleiderschrank/Decke dämpft Hall), 10–15 cm Abstand zum Mikro. 2–3 Takes, den natürlichsten nehmen – nicht den "perfektesten".
3. **B-Roll filmen** (im Gym, gebündelt): pro Video 8–15 Clips à ca. 5 Sekunden, Hochformat 9:16, 1080p oder 4K. Handy an Flasche/kleines Stativ lehnen. Immer mehr filmen, als gebraucht wird.
4. **Schnitt in CapCut**: Voiceover als erste Spur, dann Clips auf den Sprechrhythmus legen. Szenenwechsel alle 1,5–3 Sekunden. Der erste Clip muss zur Hook passen – die ersten 2 Sekunden entscheiden.
5. **Untertitel**: CapCut Auto-Captions (Deutsch), danach IMMER manuell korrigieren (Gym-Begriffe werden oft falsch erkannt). Große, gut lesbare Schrift im mittleren/unteren Drittel, nicht vom TikTok-UI verdeckt.
6. **Cover + Export**: Cover-Frame mit klarer Textzeile wählen ("3 Anfängerfehler") – wichtig für die Profil-Ansicht. Export 1080p, direkt in TikTok hochladen (keine Wasserzeichen anderer Apps).

### Variante B – TTS-Voiceover (z. B. ElevenLabs)

- **Kosten (Stand Juli 2026, können abweichen):** ElevenLabs Starter ca. 6 $/Monat (ca. 30.000 Credits – reicht grob für 20–30 Kurzvideo-Voiceovers), Creator ca. 22 $/Monat inkl. professionellem Cloning der eigenen Stimme.
- **Ablauf:** Script einfügen → deutsche Stimme wählen (oder eigene Stimme klonen, dann bleibt es "deine" Stimme) → Audio exportieren → weiter wie Variante A ab Schritt 3.
- **Grenzen ehrlich benannt:** Gute TTS-Stimmen sind 2026 sehr nah dran, aber bei Ironie, Betonung und Gym-Slang hört man den Unterschied. Für Aufklärungsvideos okay; für Story-/POV-Videos (6, 7) eigene Stimme nehmen. TTS-Ausgabe immer gegenhören (Zahlen wie "neun Euro", Betonungen).

### Variante C – Avatar / AI-Human (HeyGen, Synthesia, Argil)

| Tool | Preis (Stand Juli 2026, kann abweichen) | Einordnung für ZENITH |
|---|---|---|
| HeyGen Creator | ca. 29 $/Monat (600 Credits ≈ grob 30 Min Avatar-Video/Monat) | Beste Option für Talking-Head-Aufklärung; eigener Foto-/Video-Klon möglich |
| Synthesia Starter | ca. 29 $/Monat monatlich bzw. ca. 22 $/Monat bei Jahreszahlung; ca. 10 Videominuten/Monat | Eher Corporate-Look; für TikTok-Gym-Content meist zu steif |
| Argil Classic | ca. 39 $/Monat (ca. 25 Min Video) | Auf Social-Clips ausgelegt, eigener Klon; teuerste der drei Einstiegsstufen |

- **Wann Avatar okay ist:** reine Erklärformate (Videos 1, 2, 8, 9), wenn wirklich keine Zeit zum Filmen ist – idealerweise als Klon der eigenen Person, nicht als Stock-Avatar.
- **Wann es unnatürlich wirkt (ehrlich):** POV- und Story-Formate, Nahaufnahmen, Übungsausführung, schnelle Bewegungen, Humor/Ironie. Hände und Gestik verraten Avatare am schnellsten. Ein Stock-Avatar, der "seine Gym-Story" erzählt, ist für eine Ehrlichkeits-Marke ein Eigentor.
- **Kennzeichnungspflicht (wichtig):** TikTok verlangt, realistisch wirkende KI-generierte Inhalte beim Upload als KI-generiert zu kennzeichnen (Schalter "KI-generierter Inhalt" aktivieren). Zusätzlich gelten in der EU Transparenzpflichten für KI-generierte Medien. Regel für ZENITH: **Jedes Avatar-/TTS-Video, das als echt wahrgenommen werden könnte, wird gekennzeichnet – ohne Ausnahme.** Das passt ohnehin zum ehrlichen Markenkern.

### Übergreifende Regeln (alle Varianten)

- **Untertitel immer an** – viele schauen ohne Ton.
- **Schnittrhythmus:** kein Clip länger als 3 Sekunden ohne Veränderung (Schnitt, Zoom, Text-Einblendung).
- **Hook doppelt:** gesprochen UND als Text-Overlay in den ersten 2 Sekunden.
- **Thumbnail/Cover:** einheitlicher Stil (klare Textzeile, Markenfarben), damit das Profil wie eine sortierte Serie aussieht.
- **CTA einheitlich:** immer "Link im Profil" + Code nennen, damit die Code-Einlösungen als Messgröße funktionieren.

---

## 4. UGC-/Affiliate-Programm

### So funktioniert es

1. **Wer:** Freunde, Trainingspartner, kleine deutschsprachige Gym-Creator (auch 1.000–20.000 Follower sind wertvoll – Vertrauen zählt mehr als Reichweite).
2. **Code:** Jeder Partner bekommt einen eigenen Rabattcode nach dem bestehenden Muster (z. B. nach der inaktiven Vorlage `CREATOR-LEA` = 15 %), angelegt wie die vorhandenen Codes in `data/discount-codes.json`. Für enge Freunde gibt es `FRIEND10` (10 %) bzw. bei Bedarf einen eigenen Code.
3. **Attribution:** Einlösungen werden pro Code/Quelle gezählt. Das ist die Abrechnungsgrundlage – kein kompliziertes Tracking nötig.

### Was Partner posten sollen (Briefing)

- 1–2 Videos pro Monat reichen. Formate: "Ich teste den Plan eine Woche" (ehrliches Fazit, Kritikpunkte ausdrücklich erlaubt), Plan-Einblick vom eigenen Handy, oder ein eigener "Anfängerfehler"-Take mit Code im CTA.
- **Nicht erlaubt:** Ergebnisversprechen ("X kg in Y Wochen"), medizinische Aussagen, Fake-Begeisterung. Lieber "hat mir Struktur gegeben" als "hat mein Leben verändert".
- CTA-Baustein: "Mit meinem Code [CODE] bekommst du [X] Prozent – Link in meiner Bio / im Kommentar."

### Faire Gegenleistung

- **Provisionsmodell (Empfehlung):** 30 % vom Netto-Umsatz jeder Einlösung des eigenen Codes. Beispiel: Komplett-Paket 39 € mit 10 % Rabatt = 35,10 € → ca. 10,50 € Provision. Bei Mini-Plänen entsprechend weniger – Partner deshalb auf die Pakete (9/19/39 €) briefen.
- **Abrechnung:** manuell, einmal pro Monat: Einlösungen pro Code auswerten → kurze Übersicht an den Partner schicken → Auszahlung (z. B. PayPal). Bei den aktuellen Preispunkten ist das mit wenigen Partnern gut per Hand machbar; automatisieren erst, wenn es sich lohnt.
- **Zusätzlich:** Partner bekommen das Komplett-Paket kostenlos, damit sie ehrlich zeigen können, was drin ist.

### Rechtlicher Hinweis (nicht optional)

- Videos mit eigenem Affiliate-Code sind **Werbung** und müssen in Deutschland als solche gekennzeichnet werden: **#werbung bzw. "Anzeige" klar sichtbar am Anfang** des Videos/der Caption – nicht versteckt zwischen zwanzig Hashtags.
- Auch wenn Partner das Produkt "nur" geschenkt bekommen haben, gilt die Kennzeichnungspflicht.
- Das gehört schriftlich in jedes Partner-Briefing. Es schützt die Partner und die Marke. (Keine Rechtsberatung – im Zweifel Kennzeichnung großzügig handhaben.)

---

## 5. Wochen-Postingplan (realistisch für 1 Person)

Prinzip: **Batch am Wochenende, posten unter der Woche.** 4 Posts pro Woche sind nachhaltig; lieber 4 konstant als 7 für zwei Wochen und dann nichts.

| Tag | Aufgabe | Zeitaufwand |
|---|---|---|
| **Samstag** | Batch-Produktion Teil 1: 4 Scripts finalisieren, alle Voiceovers aufnehmen, B-Roll im Gym filmen (eine Session für alle 4 Videos) | 2,5–3 h |
| **Sonntag** | Batch-Produktion Teil 2: alle 4 Videos in CapCut schneiden, Untertitel korrigieren, Cover setzen; als Entwürfe ablegen | 2–3 h |
| **Montag** | Video 1 posten (stärkstes der Woche, meist Fehler/Aufklärung). 15 Min Kommentare beantworten | 20 Min |
| **Dienstag** | Kein Post. 15 Min Community: Kommentare beantworten, auf themennahe Videos anderer reagieren | 15 Min |
| **Mittwoch** | Video 2 posten (Plan-Einblick oder "Was kostet"). Kommentare | 20 Min |
| **Donnerstag** | Video 3 posten (Story/POV oder Mythos). Kommentare | 20 Min |
| **Freitag** | Video 4 posten (CTA-lastig: Newsletter oder Paket – vor dem Wochenende, wenn viele Gym-Vorsätze fassen). Kurzer Blick in die Zahlen fürs Wochenreview | 25 Min |

Gesamtaufwand: ca. 6–7 Stunden pro Woche. Posting-Uhrzeit: als Startpunkt 17–20 Uhr testen (nach Schule/Arbeit, vor dem Training), dann anhand der eigenen Daten anpassen – nicht anhand fremder "beste Uhrzeit"-Listen.

---

## 6. Messgrößen & Review

### Kennzahlen

| Messgröße | Wo ablesen | Wofür sie steht |
|---|---|---|
| 3-Sekunden-Hook-Rate (Anteil, der nach 3 s noch schaut) | TikTok Analytics pro Video | Qualität der Hook (erste 2 Sekunden) |
| Watchtime / durchschnittliche Wiedergabedauer | TikTok Analytics | Qualität von Script und Schnitt |
| Profilklicks | TikTok Analytics | Funktioniert der CTA "Link im Profil"? |
| Link-Klicks (Bio-Link) | TikTok / Link-Statistik | Übergang TikTok → Landingpage |
| Newsletter-Signups | Newsletter-Tool / Website | Funnel-Zweig "noch nicht kaufbereit" |
| Code-Einlösungen pro Code | Auswertung der Einlösungen (Codes aus `data/discount-codes.json`) | Härteste Kennzahl: Käufe pro Quelle (`LAUNCH20` = eigene Videos, Creator-Codes = Partner) |
| Umsatz pro Video-Thema | Stripe + Code-Auswertung, Themen manuell zuordnen | Welche Formate verkaufen (nicht nur: welche Views bringen) |

Wichtig: Views sind die schwächste Kennzahl in dieser Liste. Ein Video mit 2.000 Views und 5 Code-Einlösungen schlägt ein Video mit 100.000 Views und null Verkäufen.

### Wöchentliches 20-Minuten-Review (fester Termin, z. B. Freitagabend)

- **Min. 0–10:** Zahlen der Woche in eine einfache Tabelle eintragen (pro Video: Hook-Rate, Watchtime, Profilklicks; gesamt: Link-Klicks, Signups, Einlösungen pro Code, Umsatz).
- **Min. 10–20:** Genau **3 Entscheidungen** treffen und notieren:
  1. **Verdoppeln:** Welches Thema/Format der Woche lief am besten und bekommt nächste Woche eine Fortsetzung/Variante?
  2. **Stoppen/Ändern:** Was lief klar am schlechtesten – Thema absetzen oder nur die Hook austauschen und neu testen?
  3. **Testen:** Welche EINE neue Variable wird nächste Woche getestet (neue Hook-Formel, andere Uhrzeit, anderes CTA-Produkt, Avatar vs. Eigenaufnahme)? Immer nur eine Variable, sonst ist das Ergebnis nicht lesbar.

---

## 7. 30-Tage-Startplan

| Zeitraum | Fokus | Konkrete Aufgaben | Meilenstein am Ende |
|---|---|---|---|
| **Tage 1–3** | Setup | Bio schärfen ("Gym-Pläne ab 3 € – Link unten"), Bio-Link prüfen, Cover-Stil festlegen, `LAUNCH20` im Checkout per Testkauf prüfen, einfache Analytics-Tabelle anlegen | Funnel technisch geprüft |
| **Tage 4–7** | Erste Batch | Videos 1, 4, 6, 10 produzieren (Fehler, Plan-Einblick, POV, Newsletter) – bewusst 4 verschiedene Formate als Testlauf | 4 Videos fertig als Entwurf |
| **Woche 2 (Tage 8–14)** | Posten & lernen | 4 Posts (Mo/Mi/Do/Fr), täglich 15 Min Kommentare, erstes 20-Min-Review an Tag 14 | Erste Daten: welches Format hat die beste Hook-Rate? |
| **Woche 3 (Tage 15–21)** | Verdoppeln | Bestes Format aus Woche 2 doppelt bespielen (2 Varianten), dazu Videos 2 und 8 oder 9; zweite Batch am Wochenende; Review an Tag 21 | 8 Videos live, klarer Formattrend erkennbar |
| **Woche 4 (Tage 22–30)** | Funnel & Partner | Restliche Videos aus Abschnitt 2 posten; 2–3 Freunde/Creator ansprechen und erste Partner-Codes anlegen (nach der `CREATOR-LEA`-Vorlage); Newsletter-Welcome-Mail mit `RESET15` einrichten; großes Monatsreview an Tag 30 | Mindestens 1 aktiver Partner-Code; Monatsreview mit Zahlen pro Code |

**Erwartungshaltung (ehrlich):** 30 Tage reichen, um Formate zu testen und den Funnel zu validieren – nicht, um "viral zu gehen". Erfolgskriterium für Monat 1 ist keine Viewzahl, sondern: Der Funnel funktioniert nachweislich (messbare Link-Klicks, erste Newsletter-Signups, erste `LAUNCH20`-Einlösungen), und es ist klar, welche 2 Formate in Monat 2 verdoppelt werden.

---

*Quellen für Tool-Preise (Stand Juli 2026, alle Angaben ohne Gewähr): [ElevenLabs Pricing](https://elevenlabs.io/pricing), [HeyGen Pricing](https://www.heygen.com/pricing), [Synthesia Pricing](https://www.synthesia.io/pricing), [Argil Pricing](https://www.argil.ai/pricing).*
