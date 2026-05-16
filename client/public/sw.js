const CACHE = 'euro-rater-v3';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './js/config.js',
  './js/main.js',
  './flags/dk.png', './flags/de.png', './flags/il.png', './flags/be.png', './flags/al.png',
  './flags/gr.png', './flags/ua.png', './flags/au.png', './flags/rs.png', './flags/mt.png',
  './flags/cz.png', './flags/bg.png', './flags/hr.png', './flags/gb.png', './flags/fr.png',
  './flags/md.png', './flags/fi.png', './flags/pl.png', './flags/lt.png', './flags/se.png',
  './flags/cy.png', './flags/it.png', './flags/no.png', './flags/ro.png', './flags/at.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(r => r ?? fetch(e.request))
  );
});
