const CACHE_NAME = 'fielddiary-v1';
const FONT_CACHE_NAME = 'fielddiary-fonts-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon-180.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME && k !== FONT_CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  if(url.origin === self.location.origin){
    event.respondWith(
      caches.match(event.request).then(cached => {
        const network = fetch(event.request).then(resp => {
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, resp.clone()));
          return resp;
        }).catch(() => cached);
        return cached || network;
      })
    );
  } else if(url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com'){
    event.respondWith(
      caches.open(FONT_CACHE_NAME).then(cache =>
        cache.match(event.request).then(cached => {
          if(cached) return cached;
          return fetch(event.request).then(resp => {
            cache.put(event.request, resp.clone());
            return resp;
          });
        })
      )
    );
  }
  // everything else (Google Drive/OAuth APIs, geolocation, etc.) goes straight to network
});
