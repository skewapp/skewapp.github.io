// Skew用の簡易サービスワーカー。
// アプリとしてインストールできるようにする(PWAの要件)ためのもので、
// オフライン時は最低限このページ自体を表示できるようにする。
const CACHE_NAME = 'skew-cache-v32';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Spotify等の外部APIはキャッシュせず、常にネットワークへ素通しする
  if (!event.request.url.startsWith(self.location.origin)) return;
  if (event.request.method !== 'GET') return;

  // 常に最新版を表示する(ネットワーク優先)。つながらないときだけ保存しておいた版を使う
  event.respondWith(
    fetch(event.request, { cache: 'no-store' }).then((res) => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
      }
      return res;
    }).catch(() =>
      caches.match(event.request).then((cached) => cached || caches.match('./index.html'))
    )
  );
});
