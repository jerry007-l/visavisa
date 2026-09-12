// Service Worker - 离线缓存
const CACHE_NAME = 'visa-game-v9';
const ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/css/game.css',
    '/css/shop.css',
    '/css/itemQuickUse.css',
    '/css/result.css',
    '/js/userData.js',
    '/js/questionBank.js',
    '/js/identityPool.js',
    '/js/materialPool.js',
    '/js/items.js',
    '/js/randomEvents.js',
    '/js/achievements.js',
    '/js/soundManager.js',
    '/js/audioInit.js',
    '/js/main.js',
    '/js/roleSelect.js',
    '/js/shop.js',
    '/js/itemQuickUse.js',
    '/js/drawMaterials.js',
    '/js/materialReview.js',
    '/js/dialogue.js',
    '/js/decision.js',
    '/js/result.js',
    '/js/randomEventHandle.js',
    '/js/achievement.js',
    '/js/selfCheck.js',
    '/assets/icon.png',
    '/assets/icon-192.png',
    '/assets/icon-512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((cache) => cache !== CACHE_NAME)
                    .map((cache) => caches.delete(cache))
            );
        }).then(() => self.clients.claim())
    );
});
