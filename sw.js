const CACHE = 'sanguo-v19';
const ASSETS = [
  '.',
  'index.html',
  'css/style.css',
  'css/premium.css',
  'css/visuals.css',
  'css/enhancements.css',
  'css/performance.css',
  'css/map.css',
  'css/battle-vfx.css',
  'css/city.css',
  'css/strategy.css',
  'css/personality.css',
  'css/destiny.css',
  'css/battlefield.css',
  'css/battle-ui.css',
  // Config
  'js/config/game-balance.js',
  'js/config/heroes-data.js',
  'js/config/levels-data.js',
  'js/config/equipment-data.js',
  // Core
  'js/core/storage.js',
  'js/core/idle.js',
  'js/core/battle.js',
  // Systems
  'js/systems/heroes.js',
  'js/systems/campaign.js',
  'js/systems/gacha.js',
  'js/systems/arena.js',
  'js/systems/dungeon.js',
  'js/systems/equipment.js',
  'js/systems/destiny.js',
  'js/systems/city.js',
  'js/systems/seasonal.js',
  'js/systems/skilltree.js',
  'js/systems/strategy.js',
  // Extras
  'js/extras/hero-personality.js',
  'js/extras/narrative.js',
  'js/extras/kingdom-map.js',
  'js/extras/premium-upgrade.js',
  // UI
  'js/ui/visuals.js',
  'js/ui/portraits.js',
  'js/ui/battle-sound.js',
  'js/ui/bgm-ui-sound.js',
  'js/ui/opening-cinematic.js',
  'js/ui/skill-cutin.js',
  'js/ui/dynamic-battlefield.js',
  'js/ui/war-director.js',
  'js/ui/battle-canvas.js',
  'js/ui/battle-svg-vfx.js',
  'js/ui/battle-ui.js',
  // Main
  'js/app.js',
  'manifest.json',
  'icon-192.png',
  'icon-512.png'
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
