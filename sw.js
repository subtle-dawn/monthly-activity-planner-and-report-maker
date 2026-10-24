'use strict';

// The deployment workflow replaces this value with the commit SHA.
// When deploying manually, change the version whenever app assets change.
const VERSION = 'v1';
const CACHE_PREFIX = `monthly-activity:${self.registration.scope}:`;
const CACHE_NAME = CACHE_PREFIX + VERSION;
const APP_FILES = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './pwa.js',
  './favicon.svg',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];
const APP_URLS = new Set(APP_FILES.map(path => new URL(path, self.registration.scope).href));

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_FILES.map(path => new Request(new URL(path, self.registration.scope), { cache: 'reload' })));
  })());
  // Wait for existing tabs to close before switching app versions.
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  url.search = '';
  if (!APP_URLS.has(url.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(url.href);
    if (cached) return cached;
    return fetch(event.request);
  })());
});
