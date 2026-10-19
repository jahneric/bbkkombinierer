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
- `treffen.html` – Tagesordnungen, To-dos und Deadlines für die Orga-Treffen (eigene Seite, in der App über „treffen“ erreichbar), siehe unten
- `schicht.html` – Schichtplan für einen Abend zum Selbst-Eintragen (eigene Seite ohne Menü, nur über Link), siehe unten
- `logos/` – exportierte PNGs aller Runden, je auf schwarz / auf weiß, mit und ohne Körnung (`_ohne-koernung/`)
- `logos/partner/` – Logos von Partner-Kollektiven (z. B. reconnect)
- `tools/` – Node-Skripte (headless Chrome), um die PNGs neu zu exportieren bzw. Frames zu rendern

PNG-Export neu erzeugen: `node tools/export-logos.mjs logos all`

## Shirt-Foto

Der Shirt-Reiter nutzt ein echtes Produktfoto eines weißen T-Shirts:
„Wikimania2023 Attendee T-Shirt Mockup“ von Adien Gunarta & Naila Rahmah, Wikimedia Commons, **CC0** (gemeinfrei).
Der ursprüngliche Aufdruck wurde mit `node tools/prepare-tee.mjs` entfernt (Ergebnis: `app/tee-front.webp`).

## Collage / Leute freistellen

Der Modus „collage“ in bewegt erkennt Personen automatisch mit MediaPipe (DeepLab v3, Klasse „person“, Apache 2.0).
Das Modell liegt unter `app/deeplab_v3.tflite`, die Laufzeit kommt von cdn.jsdelivr.net.

## Treffen

`treffen.html` ist das Orga-Werkzeug: pro Treffen eine Tagesordnung als Gliederung, jede Zeile kann ein To-do mit Leuten und Deadline werden, offene To-dos wandern automatisch ins nächste Treffen. Unter „events“ bekommt jedes Event für jede Gruppe (Deko, Booking …) einen eigenen Bereich mit To-dos; wer zu welcher Gruppe gehört, steht in den Einstellungen.

Die Inhalte stehen nicht im Repo. Ohne Sync liegen sie nur im Browser des jeweiligen Geräts. Mit Sync liegen sie in Firestore, im Browser verschlüsselt (AES-GCM); der Schlüssel steckt im Einladungslink und nirgends sonst. Wer den Link hat, kann alles lesen und ändern.

Sync einrichten (einmalig):

1. Auf https://console.firebase.google.com ein Projekt anlegen, darin „Firestore Database“ erstellen (Standort `eur3`) und eine Web-App registrieren.
2. Die `firebaseConfig` der Web-App oben im Skript von `treffen.html` als `window.BBK_FIREBASE = { ... }` eintragen.
3. In Firestore unter „Regeln“ eintragen:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /spaces/{space}/items/{item} {
      allow read: if true;
      allow create, update: if request.resource.data.keys().hasOnly(['iv', 'c', 'u', 's', 'x'])
        && request.resource.data.s == request.time
        && (!('c' in request.resource.data) || (request.resource.data.c is string && request.resource.data.c.size() < 20000));
    }
  }
}
```

4. In der App unter einstellungen → sync „raum erstellen“ und den Einladungslink in die Gruppe schicken.

## Schichtplan

`schicht.html` ist der Schichtplan für einen Abend: Bereiche (Awareness, Bar, Einlass …) in halben Stunden, Leute tragen sich selbst ein. In treffen gibt es bei jedem Event „+ schichtplan“, danach „schichtplan öffnen“ (Orga) und „helfer-link kopieren“.

- Der **Helfer-Link** (`schicht.html#k=…`) zeigt nur diesen einen Plan: eintragen, wieder austragen, sehen wo Leute fehlen. Keine Menüs, keine Links in die App, nichts aus treffen.
- Der **Orga-Link** (`#k=…&o=…`, steht verschlüsselt am Event in treffen) ändert Zeiten, Bereiche, wie viele Leute pro halbe Stunde gebraucht werden und ob Namen sichtbar sind, und kann Leute austragen.
- Beginn und Ende dürfen leer bleiben und später geändert werden; Einträge außerhalb der Zeiten bleiben gespeichert.
- Gespeichert wird in Firestore unter `schichten/<id>/items`, im Browser verschlüsselt (AES-GCM) mit dem Schlüssel aus dem Link. Wer was ändern darf, sichert eine Hash-Kette: jedes Dokument trägt `h`, eine Änderung muss `p` mit `sha256(p) == h` vorzeigen und speichert `p` als neues `h`. Den Anfang der Kette kennt beim Plan nur der Orga-Link, bei einem Eintrag nur das Gerät, das ihn angelegt hat.

Firestore-Regeln (ersetzen die oben, treffen ist mit drin):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /spaces/{space}/items/{item} {
      allow read: if true;
      allow create, update: if request.resource.data.keys().hasOnly(['iv', 'c', 'u', 's', 'x'])
        && request.resource.data.s == request.time
        && (!('c' in request.resource.data) || (request.resource.data.c is string && request.resource.data.c.size() < 20000));
    }
    match /schichten/{plan}/items/{item} {
      function shape() {
        return request.resource.data.keys().hasOnly(['iv', 'c', 'u', 's', 'h', 'p', 'x'])
          && request.resource.data.s == request.time
          && request.resource.data.h is bytes
          && (!('c' in request.resource.data) || (request.resource.data.c is string && request.resource.data.c.size() < 20000));
      }
      allow read: if true;
      allow create: if shape() && !('p' in request.resource.data);
      allow update: if shape() && request.resource.data.p is bytes
        && hashing.sha256(request.resource.data.p) == resource.data.h
        && request.resource.data.h == request.resource.data.p;
    }
  }
}
```
