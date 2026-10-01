# bbk website & logo-labor

Alles rund um die visuelle Identität vom bbk kollektiv (Leipzig).

**App:** https://jahneric.github.io/bbkkombinierer/ – im Browser öffnen, am Handy über „Zum Startbildschirm hinzufügen“ als App installieren.

- `stilproben.html` – die Quelle der ganzen Seite (wird auch als Claude-Artifact veröffentlicht):
  - **logo-labor**: alle Logo-Runden, Körnung / Papier / auf weiß
  - **kombinierer**: jedes Zeichen mit jedem Schriftzug
  - **bewegt**: bewegte Logos, Event-Posts und Reels mit Übergängen, Export als MP4
  - **website**: Y2K-Desktop mit verschiebbaren Fenstern und einstellbarem Hintergrund
  - **downloads**: alle Zeichen und Schriftzüge als transparente PNGs in den Palettenfarben, plus Farbpalette (CSS, JSON, TXT, PNG)
- `index.html`, `app/`, `sw.js` – die App für GitHub Pages; `index.html` wird mit `node tools/build-app.mjs` aus `stilproben.html` gebaut
- `logos/` – exportierte PNGs aller Runden, je auf schwarz / auf weiß, mit und ohne Körnung (`_ohne-koernung/`)
- `logos/partner/` – Logos von Partner-Kollektiven (z. B. reconnect)
- `tools/` – Node-Skripte (headless Chrome), um die PNGs neu zu exportieren bzw. Frames zu rendern

PNG-Export neu erzeugen: `node tools/export-logos.mjs logos all`
