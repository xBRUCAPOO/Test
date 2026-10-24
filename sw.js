/* =========================================================
   TEST — sw.js (service worker, v1.9.1)
   Hace que la app se pueda instalar y funcione sin conexión.
   IMPORTANTE: cada vez que cambies index.html, style.css, script.js o los íconos, subí el número de CACHE
   (por ejemplo "test-v1.8.4") para que los dispositivos descarguen la versión nueva.
   ========================================================= */

// Nombre de la caché de esta versión: al cambiarlo se borran las cachés viejas
const CACHE = "test-v1.9.1";

// Archivos de la app que se guardan al instalar (la "carcasa" de la app)
const SHELL = [
  "./",
  "index.html",
  "style.css",
  "script.js",
  "manifest.json",
  "icon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/maskable-512.png",
  "icons/apple-touch-icon.png",
  "tests/index.json"
];

// Instalación: guarda la carcasa en la caché. Si un archivo falla, no rompe la instalación de los demás
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => Promise.all(SHELL.map((url) => cache.add(url).catch(() => null))))
      .then(() => self.skipWaiting()) // la versión nueva se activa sin esperar a cerrar la app
  );
});

// Activación: borra las cachés de versiones anteriores y toma el control de las pestañas abiertas
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Guarda una respuesta válida en la caché (sin bloquear la respuesta al usuario)
function remember(request, response) {
  if (response && (response.ok || response.type === "opaque")) {
    const copy = response.clone();
    caches.open(CACHE).then((cache) => cache.put(request, copy));
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Los tests (tests/*.json): primero la red, así siempre se ve la última versión; sin conexión, la copia guardada
  if (url.origin === location.origin && url.pathname.includes("/tests/")) {
    event.respondWith(
      fetch(req).then((res) => remember(req, res)).catch(() => caches.match(req))
    );
    return;
  }

  // Tipografías e iconos de Google Fonts: de la caché y se actualizan de fondo (así los iconos se ven sin conexión)
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith(
      caches.match(req).then((hit) => {
        const net = fetch(req).then((res) => remember(req, res)).catch(() => hit);
        return hit || net;
      })
    );
    return;
  }

  // Archivos de la propia app: primero la caché (carga instantánea); si no está, la red; si no hay nada, el index
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(req, { ignoreSearch: true }).then((hit) =>
        hit || fetch(req).then((res) => remember(req, res)).catch(() => (req.mode === "navigate" ? caches.match("index.html") : undefined))
      )
    );
  }
});