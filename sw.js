const STATIC_CACHE_NAME = "static-cache-v1";
const DYNAMIC_CACHE_NAME = "dynamic-cache-v1";

// List of core assets to pre-cache
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/styles.css",
  "/script.js",
  "/book-solid.svg",
  "/book-solid.png",
  "/book-solid-512.png",
  "/data/events.json",
  "https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.0/css/all.min.css",
  "https://www.thestorygraph.com/assets/logo-white-15cb57f7a4673cdf300bdcb013bb5330457e5551ce7b0021b5bd5b1aa4f87d58.png",
  "https://raw.githubusercontent.com/advplyr/audiobookshelf/refs/heads/master/client/static/icon.svg",
];

// Install event - Pre-cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log("Pre-caching static assets...");
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Activate event - Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== STATIC_CACHE_NAME &&
            cacheName !== DYNAMIC_CACHE_NAME
          ) {
            console.log("Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - Cache-first for static assets, dynamic cache for external URLs
self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  // Cache-first strategy for static assets
  if (STATIC_ASSETS.includes(requestUrl.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return (
          cachedResponse ||
          fetch(event.request).then((networkResponse) => {
            return caches.open(STATIC_CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
              return networkResponse;
            });
          })
        );
      })
    );
    return;
  }

  // Dynamic caching for external URLs (e.g., APIs or external resources)
  if (requestUrl.origin !== location.origin) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return (
          cachedResponse ||
          fetch(event.request).then((networkResponse) => {
            return caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
              return networkResponse;
            });
          })
        );
      })
    );
    return;
  }

  // Default to network-first for other requests
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
