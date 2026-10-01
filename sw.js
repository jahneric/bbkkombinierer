// network first, cache as fallback: the app always gets the newest version when online and still opens offline.
// logo PNGs under logos/ are not precached (hundreds of MB); everything the app itself needs is.
const CACHE = 'bbk-app-v2';
const CORE = ['./', './index.html', './app/manifest.webmanifest', './app/icon-192.png', './app/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url), keep = url.origin === location.origin ? !url.pathname.includes('/logos/')
    : /fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/.test(url.host);
  e.respondWith(fetch(e.request).then(r => {
    if (keep && (r.ok || r.type === 'opaque')) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html'))));
});
