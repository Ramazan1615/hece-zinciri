/*
  Hece Zinciri PRO - Güvenli Service Worker
  Geliştirme ortamında (localhost) önbelleği tamamen devre dışı bırakır ve temizler.
*/
const CACHE_NAME = 'hece-zinciri-v6';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  // Localhost geliştirme sunucusunda asla önbellek kullanma (Network Only)
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    return;
  }
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
