# Spätere Aktualisierung vorbereiten

Dieser Ordner enthält bewusst noch kein ausführbares Aktualisierungsscript und
keine GitHub Action.

Eine spätere, getrennte Automatisierung könnte:

1. ausschließlich eine fest definierte Liste offizieller Quellen abrufen,
2. neue Meldungen in das bestehende Datenformat überführen,
3. Duplikate anhand von Quelle, Datum und stabiler ID erkennen,
4. neue Datensätze ausschließlich mit `"status": "draft"` und
   `"featured": false` in eine Prüfdatei schreiben,
5. die JSON-Struktur technisch validieren.

Ein automatischer Lauf darf keine Meldung als geprüft oder hervorgehoben
veröffentlichen. Erst nach manueller Kontrolle von Datum, Zusammenfassung,
Kategorie und Quelle darf ein Mensch den Status auf `"reviewed"` setzen und
gegebenenfalls `"featured": true` vergeben.

## Sicherheitsregeln

- Keine API-Schlüssel oder Zugangsdaten im Frontend.
- Keine Zugangsdaten in Dateien des Repositorys.
- Geheimnisse einer späteren GitHub Action nur als Repository Secrets verwalten.
- Externe Texte nicht ungeprüft übernehmen.
- Quellenliste und erlaubte Domains versioniert und nachvollziehbar pflegen.
- Vor jeder Veröffentlichung JSON-Validierung und manuelle Freigabe verlangen.

Die Website selbst bleibt vollständig statisch und lädt ausschließlich
`data/ai-history.json`.

## Lokale Datenprüfung

Das lokale Prüfskript kontrolliert die vorhandene JSON-Datei, ohne sie zu
verändern:

```powershell
node scripts/validate-data.js
```

Geprüft werden Pflichtfelder, eindeutige IDs, Datumsformate, Kategorien,
Statuswerte, HTTPS-Quellen sowie die Regel, dass Entwürfe nicht hervorgehoben
werden dürfen. Bei einem Fehler endet das Skript mit Exit-Code 1.
