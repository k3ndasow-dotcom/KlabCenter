const CACHE_NAME = 'klabcenter-v23';
const CORE_ASSETS = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png', './logo-klabcenter.png'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Stratégie : réseau d'abord (données à jour), secours sur le cache si hors-ligne.
// Les appels Firebase (autre domaine) ne sont jamais interceptés.
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if(url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then(resp => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return resp;
      })
      .catch(() => caches.match(event.request))
  );
});
