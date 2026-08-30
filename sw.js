/*
  Prompteur vocal — Service Worker V5.5.15
  © 2026 C. Declerck
*/

const CACHE_NAME = "prompteur-vocal-v5.5.15";

const BASE_URL = new URL("./", self.location.href);

const APP_SHELL = [
  new URL("./", BASE_URL).href,
  new URL("index.html", BASE_URL).href,
  new URL("manifest.webmanifest", BASE_URL).href,
  new URL("icon-192.png", BASE_URL).href,
  new URL("icon-512.png", BASE_URL).href
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
  );
});

self.addEventListener("message", event => {
  if (
    event.data &&
    event.data.type === "SKIP_WAITING"
  ) {
    self.skipWaiting();
  }
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          return (
            (await caches.match(request)) ||
            (await caches.match(new URL("index.html", BASE_URL).href))
          );
        })
    );

    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) {
        return cached;
      }

      return fetch(request).then(response => {
        if (
          response &&
          response.status === 200 &&
          (
            response.type === "basic" ||
            response.type === "cors"
          )
        ) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }

        return response;
      });
    })
  );
});
