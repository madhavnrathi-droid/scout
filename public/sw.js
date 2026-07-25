/* Scout service worker
   Strategy:
   - navigations  → network-first, fall back to cached shell (offline support, always-fresh when online)
   - same-origin GET (static assets) → stale-while-revalidate
   - cross-origin (CDNs, Unsplash, fonts) → pass through to the network untouched
*/
const CACHE = 'scout-v50-0';
const SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/scout.css',
  '/scout.js',
  '/planner.css',
  '/planner.js',
  '/scout-heart.png',
  '/scout-cursor.png',
  '/favicon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Only handle our own origin; let CDN/image/API requests go straight to the network.
  if (url.origin !== self.location.origin) return;

  // The live feed must stay live — never serve /api/* from cache (rotation depends on it).
  if (url.pathname.startsWith('/api/')) return;

  // Navigations: network-first so deploys show immediately; cached shell when offline.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('/', copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((m) => m || caches.match('/')))
    );
    return;
  }

  // Static same-origin assets: stale-while-revalidate.
  e.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
