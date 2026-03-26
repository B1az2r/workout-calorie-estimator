// Service Worker - FitTracker
const CACHE_NAME = 'fittracker-v3';
const ASSETS = [
  '/fittracker/',
  '/fittracker/index.html',
  '/fittracker/style.css',
  '/fittracker/js/app.js',
  '/fittracker/js/ui.js',
  '/fittracker/js/calculator.js',
  '/fittracker/js/data.js',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js'
];

// 설치: 핵심 파일 캐시
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// 활성화: 이전 캐시 전부 삭제
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// fetch: 네트워크 우선 → 실패 시 캐시 (항상 최신 버전 우선)
self.addEventListener('fetch', e => {
  // API 호출은 캐시하지 않음
  if (e.request.url.includes('apis.data.go.kr')) return;

  e.respondWith(
    fetch(e.request)
      .then(response => {
        // 네트워크 성공 시 캐시도 업데이트
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return response;
      })
      .catch(() => {
        // 오프라인 시 캐시 반환
        return caches.match(e.request).then(cached => {
          if (cached) return cached;
          if (e.request.mode === 'navigate') {
            return caches.match('/fittracker/index.html');
          }
        });
      })
  );
});
