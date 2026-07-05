/* iNat Lab — Service Worker
   Caches static CDN assets and API responses for faster repeat access.

   Strategy:
   - Static CDN (Leaflet, esri-leaflet, Inter + Literata fonts): cache-first, indefinite (versioned URLs)
   - API data (iNat, Wikipedia): stale-while-revalidate, 1 hour
   - Images & map tiles: cache-first, 24 hours, LRU eviction
   - Everything else: network-only (no caching)

   IMPORTANT — error handling: when a network fetch genuinely fails (a CORS block,
   DNS/network error, or a rejected request), this SW lets the error PROPAGATE as a
   real network failure. It must NOT manufacture a synthetic Response (e.g. a fake
   503), because the page can't tell that apart from a real upstream HTTP error.
   Real upstream HTTP errors (a genuine 500/503) still pass through with their true
   status, because fetch() resolves for those — only rejections propagate.
*/

const CACHE_STATIC = 'inatlab-static-v2';
const CACHE_API    = 'inatlab-api-v1';
const CACHE_IMG    = 'inatlab-img-v2';
/* Field Guide representative photos (iNat default_photo per taxon). A dedicated,
   durable bucket so they are NEVER evicted by map-tile churn in CACHE_IMG. iNat
   photo CDN hosts are shared by record photos and taxon photos, so host-based
   routing can't tell them apart — presence in THIS cache is the reliable signal.
   Populated + trimmed by the page (see cacheTaxonPhotoImage in index.html). */
const CACHE_TAXON_PHOTOS = 'inatlab-taxon-photos-v1';

const API_MAX_AGE     = 60 * 60 * 1000;       // 1 hour
const IMG_MAX_AGE     = 24 * 60 * 60 * 1000;  // 24 hours
const API_MAX_ENTRIES = 500;
const IMG_MAX_ENTRIES = 5000;

/* ── Static CDN assets to precache on install ── */
const PRECACHE = [
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/esri-leaflet@3.0.12/dist/esri-leaflet.js',
  'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,400;0,14..32,500;0,14..32,600;0,14..32,700;1,14..32,400;1,14..32,500&display=swap',
  'https://fonts.googleapis.com/css2?family=Literata:opsz,wght@7..72,400..600&display=swap',
];

/* ── URL pattern matching ── */
const STATIC_HOSTS = ['unpkg.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

const API_PATTERNS = [
  /api\.inaturalist\.org\/v1\//,
  /en\.wikipedia\.org\/(api|w\/api)/,
];

const IMG_PATTERNS = [
  /static\.inaturalist\.org/,
  /inaturalist-open-data\.s3/,           // iNat S3 photo CDN
  /upload\.wikimedia\.org/,
  /\.tile\.openstreetmap\.org/,
  /\.tile\.opentopomap\.org/,
  /server\.arcgisonline\.com/,
  /services\.arcgisonline\.com/,
  /services\.ga\.gov\.au/,
];

/* ── Install: precache static assets ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then(cache =>
      cache.addAll(PRECACHE).catch(err => {
        console.warn('[SW] Precache partial failure:', err);
      })
    ).then(() => self.skipWaiting())
  );
});

/* ── Activate: clean up old cache versions ── */
self.addEventListener('activate', event => {
  const keep = new Set([CACHE_STATIC, CACHE_API, CACHE_IMG, CACHE_TAXON_PHOTOS]);
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(names.filter(n => !keep.has(n)).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

/* ── Fetch: route to the appropriate caching strategy ── */
self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  /* Static CDN: cache-first, indefinite */
  if (STATIC_HOSTS.some(h => url.hostname === h || url.hostname.endsWith('.' + h))) {
    event.respondWith(cacheFirst(request, CACHE_STATIC));
    return;
  }

  /* Images & map tiles: cache-first, 24h TTL, LRU.
     Taxon photos (Field Guide) live in a dedicated durable bucket — check it
     first so they survive CACHE_IMG eviction; otherwise fall through to the
     shared image/tile cache. */
  if (IMG_PATTERNS.some(p => p.test(url.href))) {
    event.respondWith(taxonPhotoThenImg(request));
    return;
  }

  /* API data: stale-while-revalidate, 1h TTL */
  if (API_PATTERNS.some(p => p.test(url.href))) {
    event.respondWith(staleWhileRevalidate(request, CACHE_API, API_MAX_AGE, API_MAX_ENTRIES));
    return;
  }

  /* Everything else: network-only */
});

/* ═══ Caching strategies ═══ */

/* Field Guide taxon photos: serve from the durable dedicated bucket if present,
   otherwise treat as an ordinary image/tile (shared CACHE_IMG, TTL + LRU). The
   dedicated copy is written by the page (cacheTaxonPhotoImage); this handler only
   reads it, so it survives heavy map-tile eviction in CACHE_IMG. */
async function taxonPhotoThenImg(request) {
  const durable = await caches.open(CACHE_TAXON_PHOTOS);
  const hit = await durable.match(request);
  if (hit) return hit;
  return cacheFirstTTL(request, CACHE_IMG, IMG_MAX_AGE, IMG_MAX_ENTRIES);
}

/* Cache-first: serve from cache if present, otherwise fetch and cache. */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

/* Cache-first with TTL: serve fresh cache, fall back to network; stale cache on failure. */
async function cacheFirstTTL(request, cacheName, maxAge, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) {
    const ts = cached.headers.get('x-sw-cached');
    if (ts && (Date.now() - parseInt(ts)) < maxAge) return cached;
  }
  try {
    const response = await fetch(request);
    if (response.ok) {
      const headers = new Headers(response.headers);
      headers.set('x-sw-cached', Date.now().toString());
      const stamped = new Response(await response.clone().blob(), {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
      cache.put(request, stamped);
      trimCache(cacheName, maxEntries);
    }
    return response;
  } catch (err) {
    /* Network failure — serve stale if available; otherwise propagate. */
    if (cached) return cached;
    throw err;
  }
}

/* Stale-while-revalidate: serve cache immediately, update in background. */
async function staleWhileRevalidate(request, cacheName, maxAge, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  /* Always kick off a background network fetch to freshen the cache.
     Only swallow errors on the background path (page has a usable response). */
  const networkUpdate = fetch(request).then(async response => {
    if (response.ok) {
      const headers = new Headers(response.headers);
      headers.set('x-sw-cached', Date.now().toString());
      const body = await response.clone().blob();
      const stamped = new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
      await cache.put(request, stamped);
      trimCache(cacheName, maxEntries);
    }
    return response;
  });

  if (cached) {
    networkUpdate.catch(() => {}); // background update — swallow errors
    return cached;
  }

  /* No cache — await network. A genuine network/CORS failure rejects and propagates;
     a real upstream HTTP error resolves and passes through with its true status. */
  return await networkUpdate;
}

/* FIFO trim: remove oldest entries when cache exceeds max. */
async function trimCache(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > max) {
    const excess = keys.length - max;
    for (let i = 0; i < excess; i++) await cache.delete(keys[i]);
  }
}
