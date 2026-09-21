// Service worker mínimo: cachea assets estáticos y catálogos de solo
// lectura (equipos, kits, complejidades, datos de empresa) para que la app
// cargue rápido e instalable (skill, sección 0 — PWA). Deliberadamente NO
// implementa sincronización offline: cualquier solicitud que no sea GET
// (crear/editar cliente o cotización, cambiar estado, etc.) pasa directo a
// la red sin pasar por el service worker, así que si no hay conexión al
// guardar, la solicitud simplemente falla — la app ya maneja ese error y lo
// informa claramente en pantalla, nunca aparenta haber guardado.

const STATIC_CACHE = "climatisa-static-v1";
const CATALOG_CACHE = "climatisa-catalog-v1";

const CATALOG_PATHS = [
  "/api/equipment",
  "/api/installation-kits",
  "/api/complexities",
  "/api/company-settings",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== CATALOG_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Nunca interceptar nada que no sea GET — crear/editar/cambiar estado
  // siempre debe ir directo a la red, nunca servirse ni simularse desde
  // caché.
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (CATALOG_PATHS.includes(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, CATALOG_CACHE));
    return;
  }

  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/branding/") ||
    url.pathname === "/manifest.json";

  if (isStaticAsset) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  }
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    if (cached) return cached;
    throw err;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkFetch = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  return cached ?? (await networkFetch) ?? new Response(null, { status: 503 });
}
