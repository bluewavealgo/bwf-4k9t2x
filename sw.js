// BlueWave Finance service worker — keeps the app working offline.
// Only the app itself is cached; your data never leaves the device's encrypted storage.
const VERSION = 'bwl-c622e006c6';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' }))))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;   // never touch sync calls
  if (u.pathname.endsWith('/version.json') || u.pathname.endsWith('/sw.js')) return;   // always ask the website
  const put = r => { if (r && r.ok) { const c2 = r.clone(); caches.open(VERSION).then(c => c.put(e.request, c2)); } return r; };
  if (e.request.mode === 'navigate' || u.pathname.endsWith('/') || u.pathname.endsWith('/index.html')) {
    // the app page: newest from the website when online (3.5 s), otherwise the saved copy
    e.respondWith(new Promise(res => {
      let done = false; const fallback = () => caches.match(e.request, { ignoreSearch: true }).then(h => h || caches.match('./index.html'));
      const t = setTimeout(() => { fallback().then(h => { if (h && !done) { done = true; res(h); } }); }, 3500);
      fetch(e.request, { cache: 'no-store' }).then(r => { put(r); if (!done) { done = true; clearTimeout(t); res(r); } })
        .catch(() => fallback().then(h => { if (!done) { done = true; clearTimeout(t); res(h || Response.error()); } }));
    }));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(put)));
});
