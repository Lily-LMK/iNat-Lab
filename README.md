# iNat Lab

A single-file, no-build web app for exploring **iNaturalist** records — loaded from a CSV
export or pulled live from the iNaturalist API — and running an imaging / metadata workflow
over them. It lets you interrogate a species and a record set more smoothly and cleanly than
iNaturalist itself: filter down a full taxonomic cascade, compare observers, map observations,
and generate image titles and keywords.

**Live:** https://lily-lmk.github.io/iNat-Lab/

## Run it locally

There's no build step. Serve the folder over HTTP (not `file://`, so `fetch`/CORS work):

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Then either **Load new…** to open an iNaturalist CSV export, or use the **Add records** panel
to pull records live by username and/or project.

The first API fetch on a dataset opens a **Top-up scope** dialog so the fetch reproduces the
filter that made your CSV (a CSV export is only the rows that passed a filter — the filter
itself, e.g. a place or "no plants", isn't in the file). Paste the **Query** string from
iNaturalist's Export page to fill it exactly, or edit the inferred suggestion. It also carries an
**observed date range** and an **"Uploaded since"** boundary — clear the latter to *backfill*
older in-scope records already on iNaturalist (handy after you widen the scope, e.g. adding
plants). See [Top-up scope](#top-up-scope).

## What it does

- **Ingest** — iNaturalist CSV export, or live API top-up by username(s) / project, constrained
  by a **Top-up scope** that reproduces the CSV's original iNat query.
- **Filter** — kingdom → phylum → class → order → superfamily → family → subfamily → tribe →
  genus → species, plus user, quality grade, date range, and free-text search. Active filters
  show as a chip bar you can clear individually or all at once.
- **Views** — Records, Taxa, Field Guide, Dates, Map.
- **Compare** — two observers side by side (A/B colour coding).
- **Metadata** — generate an image **title** and **keywords** for any record (copy to
  clipboard); reconcile taxonomy against iNaturalist ("Update taxa").
- **Map** — Leaflet basemaps (OSM / topo / satellite / Esri topo / geology, with geology
  click-to-identify); observation points coloured **by taxonomic rank or by observer**, with a
  live legend.
- **Offline** — a service worker caches the app shell and, on import, warms a durable per-taxon
  photo cache so a loaded set stays explorable offline. Your data is never cached to the repo —
  only the app shell and your own session's fetched media. See
  [Offline & caching](#offline--caching) for what's stored and how to confirm it.
- **Accessible** — keyboard-operable throughout (record cards and Field Guide tiles are focusable
  and open with Enter/Space; the record dialog traps focus and restores it on close), visible focus
  rings, honoured `prefers-reduced-motion`, and a mobile off-canvas drawer. Targets WCAG 2.1 AA.

## Top-up scope

A CSV export from iNaturalist is only the **rows that passed a filter** — the filter (a place,
"no plants", a quality grade, an observed-date window) isn't recorded in the file. So a naive
top-up, which can only fetch by username + date, would pull records the original export would
have excluded (a tracked observer's overseas trip, plants you'd deliberately left out).

To prevent that, the first API fetch on a dataset opens a **Top-up scope** dialog. Nothing is
applied silently — you confirm it, and it's then reused for later fetches (edit it any time via
**Set / edit scope…**).

- **Paste the Export Query** — the most accurate option. iNaturalist's Export page shows a
  **Query** field (e.g. `has[]=photos&quality_grade=research&iconic_taxa[]=Insecta&place_id=…&without_taxon_id=47126&d1=2024-01-01&…`).
  Paste it and press **Read query** to fill taxa, place, exclusions, dates, and the
  Usernames/Project fields exactly.
- **Taxa** — every iconic group is a checkbox; groups present in your data are pre-ticked and
  marked ✓. Tick a group you expect but haven't observed yet so it stays reachable.
- **Place / bounding box** — a `place_id` is precise; a bounding box derived from your data is
  offered as a fallback but left **off by default** (a rectangle round your current points would
  silently reject a legitimate new record just outside them).
- **Observed date range** (`d1`/`d2`) — leave "To" blank for "up to now".
- **Uploaded since** — the top-up boundary. Defaults to your CSV export; records uploaded after
  it are fetched even if observed long ago. **Clear it to backfill** older in-scope records
  already on iNaturalist — use after widening the scope (e.g. adding plants).

## Data sources

- **iNaturalist** — records (CSV or API), taxonomy, common names, links.
- **Wikipedia** — species descriptions and images (species deep-dive, planned).
- **Public spatial services** — bioregions (IBRA/IMCRA), LGAs, geology, elevation (planned).

All sources are public and keyless. The app bundles **no data and no API keys**; everything
loads at runtime.

## Architecture

- `index.html` — the whole app: HTML + CSS + JS inline, no framework, no build.
- `sw.js` — the offline service worker (app-shell + media caching).
- External deps via CDN: Inter + Literata (Google Fonts), Leaflet 1.9.4, esri-leaflet 3.0.12.
- Deploys as a static site (GitHub Pages).

The visual identity is "Gallery": a light-default, editorial, photographer-portfolio aesthetic
(one typeface, hairline/monochrome UI so the photographs are the colour) with an opt-in dark
theme.

## Offline & caching

iNat Lab uses **explicit offline storage** (the [Cache Storage
API](https://developer.mozilla.org/docs/Web/API/CacheStorage), driven by the service worker) —
not the browser's ordinary HTTP cache. Three named caches hold different things:

- **`inatlab-static-*`** — the app shell + CDN assets (Leaflet, esri-leaflet, fonts, site icons).
  CDN assets are cached indefinitely (versioned URLs). The **HTML document is network-first**: an
  online visit always fetches the freshest `index.html` (so you're never stuck on stale app code),
  and a copy is kept here so the app still opens when you're **offline** — reloading with no network
  serves the last-seen shell.
- **`inatlab-taxon-photos-*`** — the **Field Guide's** representative photos: iNaturalist's own
  curated `default_photo` per taxon, keyed by taxon ID. Warmed in the background on import (fetched
  ~30 taxa per API request), stored in a **dedicated durable bucket** so heavy map use can't evict
  them. A small JSON index (photo URL + attribution + licence per taxon) lives in the same cache so
  photos stay referenceable offline across sessions. Field Guide tiles fall back to your own record
  photo until each taxon's iNat photo is warmed, so the guide is never blank.
- **`inatlab-img-*`** — map tiles and record photos (Records / Map / detail views), cache-first with
  a 24-hour TTL and size-capped eviction.

Your CSV / observation data is **never cached to disk and never committed** — only the app shell
and media your session fetches.

**Durability.** Cached storage is eviction-eligible under disk pressure by default, so on load the
app calls `navigator.storage.persist()` once to request **persistent storage** for the origin.
Browsers grant this on their own terms (Chrome silently, from engagement heuristics such as repeat
visits or bookmarking; Firefox may prompt), so it may not be granted on a first visit.

**Confirming it in DevTools** (Chrome/Edge — **F12** → **Application** tab):

- **Application → Storage** — shows total usage and, under *Storage*, whether the origin is using
  **persistent** storage. "Clear site data" here wipes all caches (the next import re-warms them).
- **Application → Cache Storage** — expand to see the three buckets above and inspect individual
  entries; `inatlab-taxon-photos-*` should fill with iNaturalist photo URLs as warm-up runs.
- **Console** — a `[iNat Lab] Persistent storage…` line reports the grant result on load. You can
  also query it live:

  ```js
  await navigator.storage.persisted();  // true if the origin's storage is persistent
  await navigator.storage.estimate();   // { usage, quota } in bytes
  ```

## Privacy

iNat Lab is intended to be publicly shareable. It contains no personal defaults and never
commits your observation exports — `.gitignore` blocks `*.csv` / `*.numbers`. Your data stays
in your browser session.

## License & attribution

TBD (add before wider publishing). Respect the licences of iNaturalist, Wikipedia, and the
spatial services; surface attribution in the UI for every displayed image and enriched value.
