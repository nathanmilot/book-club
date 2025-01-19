const STATIC_CACHE = "static-cache";
const DYNAMIC_CACHE = "dynamic-cache";

// List of core assets to pre-cache
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/style.css",
  "/script.js",
  "/data/events.json",
  "/images/audiobookshelf-logo.svg",
  "/images/book-solid-512.png",
  "/images/book-solid.png",
  "/images/book-solid.svg",
  "/images/story-graph-logo.png",
  "https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.0/css/all.min.css",
];

// Install event - Compare and update static cache
self.addEventListener("install", async () => {
  updateStaticAssets();
});

async function updateStaticAssets() {
  const updatePromises = STATIC_ASSETS.map(async (url) => {
    updateStaticCache(url);
  });
  await Promise.all(updatePromises);
  self.skipWaiting();
}

setInterval(updateStaticAssets, 30000);

async function updateStaticCache(url) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await caches.match(url);
  const networkResponse = await fetch(url, { cache: "reload" });

  if (networkResponse.ok) {
    if (cachedResponse) {
      const cachedText = await cachedResponse.text();
      const networkText = await networkResponse.clone().text();

      if (cachedText !== networkText) {
        await cache.put(url, networkResponse.clone());
        notifyClients();
      }
    } else {
      await cache.put(url, networkResponse.clone()); // Add new asset
    }
  } else {
    console.warn(`Failed to fetch asset: ${url}`);
  }
}

// Fetch event - Serve from cache or fallback to network
self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  if (STATIC_ASSETS.includes(requestUrl.pathname)) {
    // Cache-first strategy for static assets
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          updateStaticCache(requestUrl);
          return cachedResponse;
        }
      })
    );
  } else {
    // Dynamic cache with fallback
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          const cache = await caches.open(DYNAMIC_CACHE);
          cache.put(event.request, response.clone());
          return response;
        })
        .catch(() => caches.match(event.request)) // Fallback to cache if offline
    );
  }
});

// Notify clients about cache updates
function notifyClients() {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({ type: "CACHE_UPDATED" });
    });
  });
}
