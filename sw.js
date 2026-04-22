const CACHE_NAME = 'guru-ganti-v1';

// Static assets to cache
const STATIC_ASSETS = [
  '/gg/',
  '/gg/index.html',
  '/gg/manifest.json',
  '/gg/icon-192.png',
  '/gg/icon-512.png'
];

// Domains to NEVER cache (live data)
const BYPASS_DOMAINS = [
  'script.google.com',
  'googleapis.com',
  'google.com'
];

// ── Install: pre-cache static assets ──────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: remove old caches ───────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: cache-first for static, network-only for GAS ───────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Bypass Google domains — always go to network
  const isBypass = BYPASS_DOMAINS.some(domain => url.hostname.includes(domain));
  if (isBypass) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache-first strategy for static assets
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Only cache valid GET responses within our scope
        if (
          event.request.method === 'GET' &&
          response.status === 200 &&
          url.pathname.startsWith('/gg/')
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
