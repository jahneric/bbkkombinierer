# bbk website & logo-labor

Alles rund um die visuelle Identität vom bbk kollektiv (Leipzig).

- `stilproben.html` – eine einzige Seite, direkt im Browser öffnen (Chrome):
  - **logo-labor**: alle Logo-Runden, Körnung / Papier / auf weiß
  - **kombinierer**: jedes Zeichen mit jedem Schriftzug
  - **bewegt**: bewegte Logos, Event-Posts und Reels mit Übergängen, Export als MP4
  - **website**: Y2K-Desktop mit verschiebbaren Fenstern und einstellbarem Hintergrund
- `logos/` – exportierte PNGs aller Runden, je auf schwarz / auf weiß, mit und ohne Körnung (`_ohne-koernung/`)
- `logos/partner/` – Logos von Partner-Kollektiven (z. B. reconnect)
- `tools/` – Node-Skripte (headless Chrome), um die PNGs neu zu exportieren bzw. Frames zu rendern

PNG-Export neu erzeugen: `node tools/export-logos.mjs logos all`
