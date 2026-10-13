const CACHE_NAME = "wird-app-shell-v1";
const APP_SHELL_FILES = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./competition.js",
  "./supabase-config.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const appShellUrls = APP_SHELL_FILES.map(
        (file) => new URL(file, self.registration.scope),
      );
      await cache.addAll(appShellUrls);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name.startsWith("wird-app-shell-") && name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        return (
          (await cache.match(request)) ||
          (await cache.match(new URL("index.html", self.registration.scope)))
        );
      }),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => cachedResponse || fetch(request)),
  );
});
