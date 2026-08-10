const CACHE_VERSION = "tropic-tray-v3-phaser";
const ROOT = new URL("./", self.location.href).pathname;
const appPath = (path = "") => `${ROOT}${path}`;
const APP_SHELL = [
  "", "offline/", "support/", "privacy/", "terms/", "manifest.webmanifest", "icon-192.png", "icon-512.png", "og.png",
  "game-assets/tropic-tray-background.webp",
  "game-assets/drink-lime_spritz.webp",
  "game-assets/drink-mango_pitcher.webp",
  "game-assets/drink-coral_lemonade.webp",
  "game-assets/drink-blue_punch.webp",
  "game-assets/drink-sunset_bowl.webp",
  "game-assets/drink-mint_mojito.webp",
  "game-assets/drink-island_royale.webp",
  "game-audio/cocktail_launch.wav",
  "game-audio/cocktail_merge.wav",
  "game-audio/cocktail_chain.wav",
].map(appPath);

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(async () => (await caches.match(event.request)) || (await caches.match(appPath("offline/")))),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      if (response.ok && (url.pathname.startsWith(appPath("assets/")) || url.pathname.startsWith(appPath("_next/")) || /\.(?:png|webp|wav)$/.test(url.pathname))) {
        const copy = response.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
      }
      return response;
    })),
  );
});
