// bump this string any time index.html (or any cached file) changes,
// so the next launch fetches fresh files instead of serving stale ones
const CACHE_NAME = "score-reader-v2";

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-180.png",
  "./icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// cache-first: works with zero network once installed; if a fetch fails
// (offline) and the item isn't cached, this just lets the browser show
// its normal offline error rather than hanging
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
