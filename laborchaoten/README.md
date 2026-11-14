# Laborchaoten · Bilderbuch-Prototyp 01

Lokales HTML-Bilderbuch für **Runlevel Labs – Aus dem Leben dreier Laborchaoten**.
HTML5, CSS3 und Vanilla JavaScript, ohne Bibliotheken, externe Fonts oder Netzwerkanfragen.

## Starten

`index.html` im Browser öffnen (Doppelklick genügt). Kein Build und keine Installation nötig.
Alternativ: `node tools/serve.cjs` und http://127.0.0.1:4173 öffnen.
Der Server lauscht ausschließlich auf dem eigenen Rechner. Mit Strg+C beenden.

## Bedienung

- **Buch öffnen** oder rechte Pfeiltaste: Cover aufschlagen.
- Pfeilbuttons oder **← / →**: vor- und zurückblättern.
- Auf Smartphones: horizontal über die Buchseite wischen. Vertikales Scrollen bleibt möglich.
- **Buch schließen** oder **Escape**: zum Cover zurückkehren; die Leseposition bleibt erhalten.
- Bei aktivierter Systemeinstellung für reduzierte Bewegung erfolgen Wechsel sofort.

Desktop zeigt zwei Seiten. Bis einschließlich 700 CSS-Pixel Breite und auf
Touch-Geräten im niedrigen Querformat erscheint eine Seite.
Nach einer Größenänderung bleibt der Anfang der zuletzt aufgeschlagenen Seite sichtbar.
Während einer Animation werden weitere Aktionen verworfen, nicht aufgestaut.

## Mindestumfang

In `scripts/book.js` legt `const MIN_BOOK_PAGES = 35;` die Mindestanzahl der
nummerierten Buchseiten fest. Der Einband zählt separat. Für beispielsweise
60 oder 100 Seiten genügt es, diesen Wert zu ändern.

Die Geschichten werden zuerst auf Seiten verteilt. Dahinter folgen freie,
nummerierte Seiten bis zum Mindestumfang. Brauchen die Geschichten mehr Platz,
wachsen Gesamtseitenzahl und Navigation automatisch mit.

## Geschichten ergänzen

In `content/pages.js` pro Geschichte einen Eintrag in `BOOK_STORIES` ergänzen.
Die ID sollte eindeutig sein und beim Überarbeiten der Geschichte erhalten bleiben.

```js
{
  id: "kaffeepause",
  title: "Eine kurze Kaffeepause",
  image: "images/kaffeepause.webp",
  imageAlt: "Tom, Gina und Sir Codi am Tisch im Labor",
  text: [
    "Ein neuer Absatz beginnt.",
    "„Wer hat den Kaffee gekocht?“",
    { image: "images/kaffeetasse.webp", imageAlt: "Eine dampfende Kaffeetasse" },
    "Die Geschichte geht nach der Illustration weiter."
  ],
  closing: "Feierabend im Labor."
}
```

Bildpfade sind relativ zu `index.html`. Das Hauptbild steht vor dem Titel.
Zusätzliche Bilder erscheinen an der angegebenen Stelle zwischen den Absätzen.
`title`, `image` und der fett gesetzte Schlusssatz `closing` sind optional.
Weitere Geschichten beginnen direkt nach dem vorhandenen Inhalt.

## Seitenaufteilung

Beim Öffnen und bei Größen- oder Schriftänderungen misst der Browser den
tatsächlichen Platz auf einer Buchseite einschließlich der Seitennummer.
Absätze bleiben nach Möglichkeit zusammen. Längere Absätze werden an Wortgrenzen
geteilt. Sehr lange Wörter können bei Bedarf an Zeichengrenzen weiterlaufen.
Illustrationen werden proportional und vollständig in ihren Rahmen eingepasst.

Bei ungerader Seitenzahl bleibt rechts am Ende des Buchs ein unnummeriertes
Blatt frei.
Bei extrem großer Schrift wächst die Buchhöhe, falls eine einzelne Zeile sonst
keinen Platz findet. Die gesamte Website kann dann vertikal gescrollt werden.

## Dateien

- `index.html`: zugängliches Grundgerüst, Cover und Navigation.
- `styles.css`: Farben, Papier, Schatten, 3D-Blätter und responsive Ansicht.
- `content/pages.js`: Geschichten und zugehörige Illustrationen.
- `scripts/pagination.js`: Messung und Verteilung von Text und Bildern auf Seiten.
- `scripts/book.js`: Mindestumfang, Rendering, Zustand, Navigation und Wischgesten.
- `tools/serve.cjs`: optionaler lokaler Vorschauserver ohne Abhängigkeiten.

Die 3D-Animation benutzt ein Blatt mit Vorder- und Rückseite, verdeckten Rückflächen
und Drehachse am Mittelsteg. Im sichtbaren Buch werden die aktuelle Doppelseite
und beim Umblättern das bewegte Blatt gerendert.

Nur lokaler Prototyp. Keine Veröffentlichung und keine GitHub-Anbindung eingerichtet.
