/* sw.js — service worker ringan.
   Menyimpan seluruh berkas aplikasi agar bisa dibuka tanpa sinyal.
   Versi lengkap (pengerasan, penanganan pembaruan) dibangun pada Tahap 6. */
const VERSI = 'log-mekanik-v1';
const BERKAS = [
  './', './index.html', './manifest.json',
  './css/style.css',
  './js/util.js', './js/master-data.js', './js/db.js',
  './js/photos.js', './js/report.js', './js/screens.js', './js/screens-admin.js', './js/app.js',
  './lib/dexie.min.js', './lib/jspdf.umd.min.js',
  './lib/jspdf.plugin.autotable.min.js', './lib/xlsx.mini.min.js',
  './icons/icon-192.png', './icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSI).then(c => c.addAll(BERKAS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(k => Promise.all(k.filter(x => x !== VERSI).map(x => caches.delete(x))))
    .then(() => self.clients.claim()));
});

/* cache-first: aplikasi selalu terbuka walau tidak ada sinyal sama sekali */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached =>
      cached || fetch(e.request).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const salinan = res.clone();
          caches.open(VERSI).then(c => c.put(e.request, salinan));
        }
        return res;
      }).catch(() => cached)
    )
  );
});
