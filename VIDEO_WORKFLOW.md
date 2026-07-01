# ZENITH – KI-gestützter Coaching-Video-Workflow

> **Status: NOCH NICHT GENERIERT.** Dieses Dokument ist ein **Produktions-Leitfaden** für die Erstellung KI-gestützter Coaching-Videos – **kein fertiges Video-Asset.** Es beschreibt Tools, Pipeline und Qualitätskriterien, damit Videos später konsistent und ehrlich produziert werden können.

---

## 1. Ziel & Prinzip

**Leitidee:** „Ein echter Mensch redet" – also ein natürlich wirkender, sprechender Coach – aber Stimme, Avatar, B-Roll, Schnitt und Untertitel werden KI-gestützt produziert und editiert.

**Ein-Video-eine-Sache-Regel.** Jedes Video behandelt:

- **1 Problem** (z. B. „Kniebeuge fühlt sich im unteren Rücken falsch an")
- **1 Erklärung** (kurz, verständlich, korrekt)
- **1 Mini-Action** (eine konkrete Sache, die der Zuschauer sofort umsetzen kann)

Kein Video versucht, „alles" zu erklären. Tiefe entsteht über die **Anzahl** kurzer, fokussierter Clips – nicht über ein überladenes Einzelvideo.

### Formate

| Format | Länge | Einsatz |
|--------|-------|---------|
| **Short** | 30–60 s | TikTok / Instagram Reels / YouTube Shorts – Reichweite & Funnel-Einstieg |
| **Modul** | 2–5 min (120–300 s) | Käufer-Lektion innerhalb eines gekauften Produkts |

**Faustregel:** Shorts ziehen Aufmerksamkeit (Hook in den ersten 2 s), Module liefern den Mehrwert, den Käufer bezahlt haben.

---

## 2. Empfohlener Tool-Stack (klare Rollenverteilung)

| # | Rolle | Empfohlene Tools | Hinweis |
|---|-------|------------------|---------|
| 1 | **Script / Drehbuch** | Claude, GPT | Hook, Kernaussage, Mini-Action strukturieren; Claim-Review (siehe Pipeline) |
| 2 | **Stimme (Deutsch)** | ElevenLabs (Primär); Alternativen: Murf, Play.ht, Azure TTS | Auf natürliche deutsche Aussprache & Betonung achten; eine konsistente Markenstimme festlegen |
| 3 | **Sprechender Mensch / Avatar / Lip-Sync** | **HeyGen, Tavus, Synthesia, D-ID** | Für realistische „talking coach"-Avatare mit Lip-Sync. **Ehrlicher Hinweis:** **Higgsfield allein ist NICHT primär für realistische sprechende Avatare gedacht** – es ist eher für cinematische Clips, B-Roll und Editing. Für echtes „Mensch redet in die Kamera" → HeyGen / Tavus / Synthesia / D-ID nehmen. |
| 4 | **B-Roll / Gym-Shots / cineastische Inserts** | Higgsfield, Runway, Kling, Pika | Hier ist Higgsfield stark: Atmosphäre, Bewegung, Übergänge, Stimmungsbilder |
| 5 | **Untertitel & Schnitt** | CapCut, Remotion, FFmpeg; Captions via Whisper oder AssemblyAI | Whisper/AssemblyAI für automatische Transkription, dann Burn-in der Untertitel |
| 6 | **Musik / SFX** | Lizenzfreie Bibliotheken (Epidemic Sound, Artlist, Uppbeat, YouTube Audio Library) | Lizenz pro genutztem Track dokumentieren |

### Wichtige Klarstellung zu Higgsfield

Higgsfield ist ein **Cinematic-/B-Roll-/Editing-Werkzeug**, kein primärer Talking-Avatar-Generator. Wer einen realistisch sprechenden Coach mit sauberem Lip-Sync braucht, nutzt **HeyGen, Tavus, Synthesia oder D-ID** für den sprechenden Part – und Higgsfield (oder Runway/Kling/Pika) **nur** für die nicht-sprechenden, atmosphärischen Bildanteile. Beides lässt sich im Schnitt kombinieren.

---

## 3. End-to-End-Workflow (Pipeline)

1. **Script** – Drehbuch mit Claude/GPT: Hook → Problem → Erklärung → Mini-Action. Pro Video genau 1 Problem.
2. **Safety / Claim-Review** – Skript prüfen: Keine medizinischen Versprechen, keine garantierten Ergebnisse, keine Übungs-Fehlinformationen. Unsichere Aussagen entschärfen oder streichen.
3. **Avatar / Voice** – Deutsche Stimme generieren (ElevenLabs) und mit Talking-Avatar (HeyGen/Tavus/Synthesia/D-ID) zusammenführen → sprechender Coach.
4. **B-Roll** – Atmosphärische Gym-Shots / cineastische Inserts ergänzen (Higgsfield/Runway/Kling/Pika), passend zur Aussage.
5. **Captions** – Transkription via Whisper/AssemblyAI, Untertitel einbrennen (CapCut/Remotion/FFmpeg). Untertitel sind für Shorts Pflicht (Stummabspielen).
6. **Musik / SFX** – Lizenzfreien Track + dezente SFX einfügen; Lautstärke unter die Sprache mischen.
7. **Export** – Hochformat 9:16 für Shorts, 16:9 oder 9:16 für Module je nach Plattform; saubere Audio-Pegel.
8. **QA-Check** – Finaler Faktencheck:
   - Ergibt das Video Sinn (Hook → Erklärung → Action)?
   - Sind Aussagen faktisch korrekt?
   - **Keine Heilversprechen / keine garantierten Resultate?**
   - Werden Übungen korrekt und sicher gezeigt/beschrieben?
   - Stimmen Lip-Sync, Untertitel und Audio-Pegel?

Erst wenn der QA-Check besteht, wird das Video veröffentlicht oder ins Käufer-Modul eingebunden.

---

## 4. Video-Packs pro Produkt

Welche Module/Themen je Produkt sinnvoll sind:

### Starter Gym Plan (€9)
- **Technik-Basics** – saubere Ausführung der Grundübungen
- **Planüberblick** – wie der Plan aufgebaut ist
- **Erste Woche** – realistisch starten ohne Überforderung

### Gym + Ernährung (€19)
- **Einkauf** – sinnvolle Basics für den Wocheneinkauf
- **Protein & Portionen** – einfache Mengen-Orientierung
- **Beispieltag** – ein realistischer Esstag als Vorlage

### Komplett-Paket (€39)
- **Wochenstruktur** – Training, Cardio, Recovery in der Woche verteilen
- **Cardio sinnvoll** – wie viel, wann, wofür
- **Schlaf & Recovery** – warum Erholung Teil des Trainings ist
- **Supplement-Basics** – was wirklich relevant ist (sinnvoll vs. unnötig)

### Mini-Pläne (€3–€5)
- **Essensplan** → 3 Tagesstrukturen
- **Supplement-Guide** → sinnvoll vs. unnötig
- **Cardio Plan** → LISS vs. Intervalle
- **Schlaf & Erholung** → praktische Abendroutine
- **Technik-Checkliste** → Cues für die Grundübungen

---

## 5. Rechtliches & Ethik

- **Keine medizinische Beratung.** Inhalte sind allgemeine Trainings- und Lifestyle-Tipps, kein Ersatz für ärztliche oder physiotherapeutische Beratung. Bei Beschwerden/Vorerkrankungen auf ärztliche Abklärung verweisen.
- **Keine garantierten Ergebnisse.** Keine Versprechen zu Gewichtsverlust, Muskelaufbau-Tempo o. Ä. Ergebnisse sind individuell.
- **KI-Avatar transparent kennzeichnen**, wo es nötig oder von der Plattform/Region gefordert ist (z. B. Hinweis, dass Stimme/Darstellung KI-generiert sind). Im Zweifel kennzeichnen.
- **Musik- & Asset-Lizenzen.** Nur lizenzfreie oder ordnungsgemäß lizenzierte Musik/SFX/Stockmaterial verwenden; Lizenznachweise pro Track dokumentieren.
- **Übungssicherheit.** Übungen korrekt darstellen; auf Risiken/typische Fehler hinweisen, wo relevant.

---

## 6. Klarstellung zum Status

Diese Videos sind **noch nicht generiert.** Dieses Dokument ist ein Produktions-Leitfaden – ein Bauplan für die Erstellung, **kein fertiges Asset.** Die konkrete Produktion (Skripte, Renderings, Schnitt) erfolgt separat anhand dieser Pipeline.
