// IIITD Gate service worker — makes the site installable as an app and keeps it usable
// when the network drops, without ever serving stale security data.
//
// Rules:
//  • /api/* (QR tokens, scan results, student data, sign-in) is NEVER cached or touched.
//  • Build assets (/_next/static/*, hashed and immutable) and icons: cache-first.
//  • Pages: network-first. Only the guard pages are kept for offline use (the guard
//    device verifies QRs offline with its signed list); any other page falls back to
//    /offline.html when there is no network.
//  • Bump VERSION to invalidate everything; old caches are deleted on activate.
//  • Kill switch: deploy a sw.js that only calls self.registration.unregister().

const VERSION = "v2";
const STATIC = `iiitd-gate-static-${VERSION}`;
const PAGES = `iiitd-gate-pages-${VERSION}`;
const PRECACHE = ["/offline.html", "/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/apple-touch-icon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("iiitd-gate-") && k !== STATIC && k !== PAGES).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Signing out clears saved pages so nothing from one account is shown to the next.
self.addEventListener("message", (event) => {
  if (event.data === "clear-pages") event.waitUntil(caches.delete(PAGES));
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return; // always live

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(STATIC).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  if (req.mode === "navigate") {
    const keepOffline = url.pathname === "/guard" || url.pathname.startsWith("/guard/");
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (keepOffline && res.ok && !res.redirected) {
            const copy = res.clone();
            caches.open(PAGES).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(async () => (keepOffline && (await caches.match(req, { cacheName: PAGES }))) || (await caches.match("/offline.html"))),
    );
  }
});
