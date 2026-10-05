const CACHE = 'sazon1821-v2';

const SHELL = [
    './',
    'index.html',
    'css/base.css',
    'css/inicio.css',
    'img/sazon1821_crop.png',
    'img/hero-ceviche-clasico.webp',
    'img/icon-192.png',
    'img/icon-512.png',
    'manifest.webmanifest'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE)
            .then((cache) => cache.addAll(SHELL.map((url) => new Request(url, { cache: 'reload' }))))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;

    // Páginas, CSS y JS propios: red primero (sin caché HTTP), con respaldo offline
    const sameOrigin = new URL(request.url).origin === self.location.origin;
    const isCode = ['style', 'script', 'manifest'].includes(request.destination);
    if (request.mode === 'navigate' || (sameOrigin && isCode)) {
        event.respondWith(
            fetch(request, { cache: 'no-cache' })
                .then((response) => {
                    const copy = response.clone();
                    caches.open(CACHE).then((cache) => cache.put(request, copy));
                    return response;
                })
                .catch(() => caches.match(request).then((cached) => cached || (request.mode === 'navigate' ? caches.match('index.html') : undefined)))
        );
        return;
    }

    // Resto (css, imágenes, CDN, fuentes): caché primero y se actualiza en segundo plano
    event.respondWith(
        caches.match(request).then((cached) => {
            const network = fetch(request)
                .then((response) => {
                    if (response && (response.ok || response.type === 'opaque')) {
                        const copy = response.clone();
                        caches.open(CACHE).then((cache) => cache.put(request, copy));
                    }
                    return response;
                })
                .catch(() => cached);
            return cached || network;
        })
    );
});
