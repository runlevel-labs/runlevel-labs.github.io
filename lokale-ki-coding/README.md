# Lokale KI fürs Coding

Statische Unterseite im bestehenden Runlevel-Labs-Design. Keine zusätzlichen
Pakete, Frameworks oder externen Dienste; Quellen werden nur als Links angeboten.

## Daten pflegen

`data/models.json` ist die einzige redaktionelle Datenquelle. `schemaVersion`
beschreibt das Format, `updatedAt` den Gesamtstand und `checkedAt` das Datum der
Quellenprüfung je Modell. Ein Modell durch Kopieren eines vorhandenen Objekts
ergänzen; eine eindeutige `id` vergeben und alle Felder aktualisieren.
`addedAt` ist das Datum der erstmaligen Aufnahme in diesen Katalog, unabhängig von
`checkedAt` und dem Veröffentlichungsdatum des Modells. Bei neuen Einträgen den
Aufnahmetag eintragen; bei Quellenupdates unverändert lassen. Für fünf Modelle aus
dem ursprünglichen Bestand ist das Datum nicht mehr sicher belegt und bleibt
`null`. Andere historische Aufnahmetage wurden aus dem ersten Datenstand des
jeweiligen Eintrags im Git-Verlauf rekonstruiert. Sie sind keine Release-Daten.
Modelle ohne bekanntes Aufnahmedatum stehen bei „Neueste zuerst“ am Ende.

- `parameters`, `quantization`, `memory`: Größe und Planungswerte mit Bezugsformat,
  kleinem Kontext, RAM-/VRAM-Trennung und Einschränkungen.
- `strengths`, `languages`, `useCases`, `repo`, `agents`: praktische Einordnung.
- `tools`, `toolNote`, `ollamaCommand`: lokal nutzbare Wege und konkretes Paket.
  Für Modelle ohne belegten Ollama-GGUF-Weg stattdessen `startLabel` und
  `startCommand` mit einem konkreten llama.cpp-Befehl verwenden. Beide
  Befehlsvarianten schließen sich aus; der Validator prüft sie getrennt.
- `license`, `offline`: Modelllizenz und Bedingungen für rein lokalen Betrieb.
- `verdict`, `limitations`: Einschätzung und Grenzen, keine behaupteten Eigenmessungen.
- `sources`: offizielle Modellkarte und Quelle für das quantisierte Paket.

Einsatzgebiete: `Code-Chat`, `Refactoring`, `Repo-Fragen`, `Tests`, `Agenten`.
Keine Rangfolge oder Benchmark-Punkte. Speicherangaben sind Schätzungen für einen
Nutzer, keine Mindestanforderungen; Sprachen sind redaktionelle Startpunkte.

Nach Datenänderungen in diesem Ordner ausführen:

```powershell
node scripts/validate-data.js
node scripts/build-data.js
```

Der Build validiert nochmals und erzeugt `data/models.js`. Die Browserdatei
ermöglicht auch das direkte Öffnen von `index.html` ohne HTTP-Server. Nicht von
Hand ändern. Vor dem Hochladen die Version des geänderten Scripts beziehungsweise
Stylesheets in `index.html` erhöhen und JSON, Browserdaten und Seite gemeinsam
übertragen. `../style.css` und `../navigation.js` werden unverändert wiederverwendet.

## Prüfung

Seite über einen lokalen statischen Server oder direkt als Datei öffnen.
Fünf Neuzugänge mit Aufnahmedatum, Suche nach Namen/Hersteller/Einsatzbereich,
beide Sortierungen, Trefferzahl, leere Suche, Sprünge von Neuzugängen zu gefilterten
Karten prüfen. Außerdem die vollständige Modellliste, ausklappbare Details,
lokale Befehle, Quellen und das mobile Navigationsmenü prüfen. Auf Desktop und Smartphone auf Umbrüche achten.
Bei fehlenden Browserdaten zeigt die Seite eine Fehlermeldung mit Link zur JSON-Datei.
Die bestehende Gina-KI-Chronik ist unabhängig und wird nicht verändert.
