// App da Área do guia: permite instalar no celular e abrir mesmo sem internet (mostra a última cópia).
const CACHE = "leo-adm-v2";
const SHELL = ["/adm", "/adm-icon-192.png", "/adm.webmanifest"];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
});
self.addEventListener("activate", (e) => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  if (req.mode === "navigate" && /^\/adm\/?$/.test(url.pathname)) {
    e.respondWith(fetch(req).then((r) => {
      if (r.ok) { const cp = r.clone(); caches.open(CACHE).then((c) => c.put("/adm", cp)); }
      return r;
    }).catch(() => caches.match("/adm")));
    return;
  }
  if (SHELL.includes(url.pathname)) e.respondWith(caches.match(url.pathname).then((m) => m || fetch(req)));
});
