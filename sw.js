const CACHE = 'sanguo-v5';
const ASSETS = [
  '.',
  'index.html',
  'css/style.css',
  'css/premium.css',
  'js/heroes.js',
  'js/storage.js',
  'js/battle.js',
  'js/campaign.js',
  'js/gacha.js',
  'js/idle.js',
  'js/equipment.js',
  'js/dungeon.js',
  'js/arena.js',
  'js/seasonal.js',
  'js/skilltree.js',
  'js/app.js',
  'manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).catch(() => caches.match('index.html')))
  );
});
