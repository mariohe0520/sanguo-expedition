const CACHE='sanguo-v1';const ASSETS=['.','/','index.html','css/style.css','js/heroes.js','js/storage.js','js/battle.js','js/campaign.js','js/gacha.js','js/idle.js','js/app.js','manifest.json'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
