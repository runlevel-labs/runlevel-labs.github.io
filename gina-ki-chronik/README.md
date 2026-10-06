# Runlevel Labs AI Timeline

Statische, responsive Website mit einer deutschsprachigen Timeline wichtiger
Meilensteine der KI-Geschichte. Alle Inhalte werden aus
`data/ai-history.json` geladen.

## Technik

- HTML, CSS und Vanilla JavaScript
- keine Frameworks oder externen Schriftarten
- keine Datenbank und keine Cloud-Abhängigkeit für die Darstellung
- geeignet für GitHub Pages und normalen statischen Webspace

## Integration in Runlevel Labs

Die Chronik ist auf der Startseite als Projekt verlinkt. `index.html` lässt
sich direkt in Chrome oder über einen statischen Webserver öffnen.
Die Browser-Daten sind in `data/ai-history.js` enthalten.

Nach Änderungen an `data/ai-history.json` aus diesem Ordner ausführen:

```powershell
node scripts/build-data.js
```

Der Befehl validiert die Daten und erzeugt die Browser-Datei neu.
Beim Veröffentlichen die Versionsnummer des Daten-Scripts in `index.html` erhöhen.

## Datenformat

```json
[
  {
    "id": "example-001",
    "date": "2026-01-01",
    "title": "Beispiel-Eintrag",
    "category": "Modelle",
    "summary": "Kurze sachliche Zusammenfassung.",
    "sourceName": "Offizielle Quelle",
    "sourceUrl": "https://example.com",
    "status": "reviewed",
    "featured": false
  }
]
```

`date` kann als Jahr (`YYYY`), Monat (`YYYY-MM`) oder vollständiges Datum
(`YYYY-MM-DD`) angegeben werden. Zulässige Kategorien:

- Forschung
- Modelle
- Open Source
- Werkzeuge
- Robotik
- Gesellschaft und Regulierung

Zulässige Statuswerte:

- `reviewed`: manuell geprüft
- `draft`: Entwurf, noch nicht geprüft

Nur geprüfte Einträge mit `"featured": true` erscheinen unter „Neueste
Entwicklungen“. Entwürfe werden dort unabhängig von `featured` ausgeschlossen.
Die historische Timeline wird chronologisch aufsteigend sortiert, „Neueste
Entwicklungen“ chronologisch absteigend.

## Pflege und Veröffentlichung

Neue Einträge benötigen eine nachvollziehbare Quelle. Entwürfe müssen zunächst
mit `"status": "draft"` und `"featured": false` gespeichert werden. Eine
Hervorhebung oder Veröffentlichung als geprüft erfolgt erst nach manueller
Kontrolle.

Eine mögliche spätere Aktualisierungsstruktur ist ausschließlich dokumentiert
in [`scripts/README.md`](scripts/README.md). Es gibt keine automatische
Veröffentlichung und keine Zugangsdaten im Projekt.
