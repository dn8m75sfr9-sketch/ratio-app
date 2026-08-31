const CACHE_NAME = 'ratio-cache-v3';
const ASSETS = [
  './ratio.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Never intercept cross-origin requests (Firebase, Firestore realtime channel, etc.)
  // Service Worker interception can break streaming/long-polling connections.
  if (!event.request.url.startsWith(self.location.origin)) return;

  // Never cache API calls - always go to network for live responses.
  if (event.request.url.includes('api.anthropic.com')) return;
  if (event.request.url.includes('/api/chat')) return;

  // Network-first: always try to get the freshest file, fall back to cache only when offline.
  event.respondWith(
    fetch(event.request).then((res) => {
      const resClone = res.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
      return res;
    }).catch(() => caches.match(event.request))
  );
});
