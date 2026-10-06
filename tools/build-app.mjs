// builds index.html (the GitHub Pages app) from stilproben.html, which stays the source.
// stilproben.html has no document head because the artifact publisher wraps it; the app needs a real one,
// plus the manifest and the service worker. run: node tools/build-app.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
let body = readFileSync(join(root, 'stilproben.html'), 'utf8').replace('<title>bbk Stilproben</title>', '');
// the meeting tool is its own page (treffen.html) and only exists in the app, not in the artifact
body = body.replace('<!--app:treffen-->', '<a href="treffen.html">treffen</a>');
const head = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#12110f">
<meta name="description" content="bbk kombinierer: logos, bewegte posts, reels und downloads vom bbk kollektiv leipzig">
<title>bbk kombinierer</title>
<link rel="manifest" href="app/manifest.webmanifest">
<link rel="icon" href="app/icon-192.png">
<link rel="apple-touch-icon" href="app/icon-192.png">
</head>
<body>
`;
const tail = `
<script>if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});</script>
</body>
</html>
`;
writeFileSync(join(root, 'index.html'), head + body + tail);
console.log('index.html gebaut');
