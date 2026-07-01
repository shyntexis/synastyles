# ZENITH — digitale Produkte

Das sind die echten Plan-Produkte. Die **vollständigen** Plan-Dateien liegen jetzt **privat** unter
`server/private/plans/` (je als `.html` + `.md`) und werden **nicht** öffentlich ausgeliefert.
Käufer erhalten sie nur über einen persönlichen, eingeloggten Zugangslink `/access/<token>`.

Öffentlich in `products/plans/` liegt nur noch `plan.css` (das Stylesheet der Plan-Seiten).
Preise/Zuordnung zentral in [`../data/products.json`](../data/products.json).

## Pakete

| Produkt | Preis | Private Datei |
|---|---|---|
| Starter Gym Plan | €9 | `server/private/plans/starter-gym-plan.{html,md}` |
| Gym + Ernährung | €19 | `server/private/plans/gym-ernaehrung.{html,md}` |
| Komplett-Paket | €39 | `server/private/plans/komplett-paket.{html,md}` |

## Mini-Pläne

| Produkt | Preis | Private Datei |
|---|---|---|
| Essensplan | €5 | `server/private/plans/mini-essensplan.{html,md}` |
| Supplement-Guide | €4 | `server/private/plans/mini-supplement-guide.{html,md}` |
| Cardio Plan | €4 | `server/private/plans/mini-cardio-plan.{html,md}` |
| Schlaf & Erholung | €4 | `server/private/plans/mini-schlaf-erholung.{html,md}` |
| Technik-Checkliste | €3 | `server/private/plans/mini-technik-checkliste.{html,md}` |

## Auslieferung & Sicherheit

- Direkte Aufrufe von `/products/plans/*.html` oder `*.md` sind serverseitig **gesperrt** (403).
- Zugriff nur über `/access/<token>` — Token pro Kauf einzigartig, an die Käufer-E-Mail gebunden,
  nur eingeloggt nutzbar. Details: [`../SELLING_LIVE_SETUP.md`](../SELLING_LIVE_SETUP.md).

## Wichtig

Inhalte sind allgemeine Trainings-/Lifestyle-Informationen, keine medizinische Beratung und keine
garantierten Ergebnisse. Jeder Plan enthält einen Disclaimer.
