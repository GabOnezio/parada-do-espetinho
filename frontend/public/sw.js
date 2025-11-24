const CACHE_NAME = 'parada-espetinho-v4';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/maskable_icon_x192.png',
  '/icons/maskable_icon_x384.png',
  '/icons/maskable_icon_x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return null;
        })
      )
    )
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Ignora esquemas não-http (ex.: chrome-extension)
  if (!request.url.startsWith('http')) {
    return;
  }

  // Não cacheia chamadas POST/PUT/DELETE da API
  if (request.url.includes('/api/') && request.method !== 'GET') {
    return;
  }

  if (request.url.includes('/api/products') && request.method === 'GET') {
    // Cache-first com fallback rede para produtos (mantém mais ágil a busca local)
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Stale-while-revalidate para assets estáticos
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            // Evita cache de requests com esquemas não-http
            if (request.url.startsWith('http')) {
              cache.put(request, clone).catch(() => {
                /* ignora erros de cache */
              });
            }
          });
        }
        return networkResponse;
      });
      return cachedResponse || fetchPromise;
    })
  );
});
