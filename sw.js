// 문장 분리기 — 오프라인에서도 열리게 해 주는 작은 도우미
// 인터넷이 되면 항상 최신 파일을 받아 쓰고, 안 될 때만 저장해 둔 사본을 씁니다.
// (새 버전을 올렸는데 예전 화면이 계속 보이는 일이 없도록 '네트워크 먼저' 방식)

const CACHE = 'munjang-bunligi-v2';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(CORE))
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        // 같은 사이트 파일과 글꼴만 사본을 남겨 둠
        const url = new URL(req.url);
        const keep = res.ok && (url.origin === self.location.origin || url.hostname === 'cdn.jsdelivr.net');
        if (keep) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) => {
          if (hit) return hit;
          if (req.mode === 'navigate') return caches.match('./index.html');
          return Response.error();
        })
      )
  );
});
