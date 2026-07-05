# iNat Lab — Next session

The immediate-actions companion to `ROADMAP.md` (full phase plan) and `../CLAUDE.md`
(orientation + current chapter). Keep this lean: what to do next, the near-term backlog, and
the settled decisions a fresh session shouldn't re-litigate.

_Last refreshed 2026-07-05. Phase 2 Step 1 (curated map palette + custom colours) is **shipped**,
and the three items testing it turned up are all **shipped** too — including the deep one, the
Field Guide iNaturalist-photo switch (see Recently shipped). Next up is the **map publication
export** (clean vector / high-DPI point map); clustering + spiderfy is back-burnered behind it._

---

## Start here next — Phase 2: publication export (clean vector / high-DPI point map)

**Reordered 2026-07-05 (Lily's call):** publication export is now next; clustering + spiderfy moves
after it and is **back-burnered** — Lily doesn't need the map offline for now, so skip the `sw.js`
precache/offline work when clustering eventually lands.

House rules apply: single-file `index.html`, **no build**; branch off `main`; verify in-browser
**light + dark + mobile (375px)**; console clean; focused commits; **don't push until Lily asks**.
(Local test data: a git-ignored `sample-inat.csv`.)

**Goal:** export the current map as a print-ready figure — points + legend + chosen colours, **no
web basemap tiles** (avoids tile CORS/licensing; gives a clean, journal-friendly graphic). Decided
over a basemap screenshot.

**Reuse, don't reinvent** (so the figure matches the on-screen map exactly):
- `markerColor(p)` (`index.html:4368`) already returns each point's colour for the current
  `mapState.colorBy` (`index.html:2457`), honouring `app.mapColorOverrides` (the custom legend
  colours). Feed the export from the *same* function.
- The per-point category-key logic (~`index.html:2233`) + `buildLegend()` (`index.html:5047`)
  already enumerate categories, counts, and colours — reuse them to draw the export legend.
- Points are `app.filteredIdx` rows with finite `_lat`/`_lng` (built at `index.html:4507`); records
  without coordinates are already excluded on the map. Carry that forward and print an **honest
  "N records omitted (no coordinate)"** note on/near the figure.

**Approach (recommended):**
- **SVG (true vector):** project each point's lat/lng into an output box and draw `<circle>`s
  coloured via `markerColor`, plus an SVG legend (swatch + label + count) and a small caption
  (extent, omitted-count, attribution "iNaturalist / observer"). Scales losslessly for print. Reuse
  Leaflet's projection *without tiles*: `mapState.map.options.crs.project(L.latLng(lat,lng))` gives
  Web-Mercator metres — fit those to the output box over the chosen bounds so shapes match the map.
- **High-DPI PNG (optional companion):** draw the same to an offscreen `<canvas>` at 2–4× and
  `toBlob()` for a raster fallback. No new deps — SVG is string-built, PNG via canvas; stays
  single-file / no-build.

**Decide with Lily at session start:**
- **Format:** SVG only, or SVG + high-DPI PNG.
- **Extent:** current map view vs. tight data bounding box (recommend **data bounds** so the figure
  isn't tied to pan/zoom).
- **Chrome:** clean point cloud vs. optional thin frame / scale bar / N-arrow (recommend minimal).
- **Trigger/UI:** an **"Export map"** button in the map toolbar → small options popover (format,
  extent, include legend) → file download. (The generic export modal is CSV-oriented; a direct file
  download likely fits better.)

**Verify:** load a set with coordinates, colour by a rank *and* by user, set a custom legend colour,
export → open the SVG/PNG and confirm points + colours + legend match the on-screen map, the
omitted-no-coordinate count is honest, and there are **no basemap tiles** in the output. The figure
itself renders on a white/transparent ground (light/dark N/A), but the trigger UI must pass
light/dark/375px + console clean.

Then (back-burnered): Phase 2 **clustering + spiderfy** (`Leaflet.markercluster`, CDN) — cluster
co-located points, spiderfy on click, cluster icons colour by dominant category, respecting the
"Colour by" control + `mapColorOverrides`. Offline/`sw.js` precache **not needed** (Lily's call).

## Visual-polish backlog (independent; do in any order)

- **Research-grade underline.** The `.rg` card bottom-border — revisit weight/colour/placement
  so it reads as an intentional "research grade" cue in both themes.
- **Name / date typography hierarchy.** Scientific name vs common name vs date — size, weight,
  italics, spacing. Make the scientific name the clear anchor.
- **Tile spacing.** Grid gaps, card padding, thumb-to-text rhythm; consistency between Records
  and Field Guide tiles.
- **Image framing.** How photos sit in the thumb (`object-fit`, aspect-ratio, radius, inset) and
  how the placeholder matches.
- **Resize-transition flash** (optional). Dragging the window across 680px briefly animates the
  drawer transform; only transition `transform` on open/close, not on the mode flip.

## Recently shipped (newest first)

- **Persistent storage + README cache section** (commits `42fe03c` + docs, **merged to `main` +
  pushed / live**). Call `navigator.storage.persist()` once on boot (after checking `persisted()`)
  so the warmed offline photo cache resists eviction under disk pressure — origin-wide, guarded,
  console-logged, no UI chrome (Chrome grants silently via engagement heuristics; Firefox may
  prompt). Added a README **"Offline & caching"** section documenting the three Cache Storage
  buckets, the never-cached data, and how to confirm via DevTools → Application → Storage /
  Cache Storage and `navigator.storage.persisted()/estimate()`.
- **Field Guide → iNaturalist representative photos** (commit `4f9ec71`, **merged to `main` +
  pushed / live**). Field Guide tiles now show
  iNaturalist's curated `default_photo` per taxon (Taxa API, keyed by `_taxonId`), **falling back
  to the record's own photo (`r._img`) until warm-up resolves each tile** so the guide is never
  blank — a strict upgrade over the old record-photo-only tiles. Records / Map / record-detail
  modal are untouched (`r._img` as before).
  - **Durable, separate storage:** a dedicated `CACHE_TAXON_PHOTOS` service-worker bucket, checked
    **before** the shared `CACHE_IMG` in the SW fetch handler, so warmed taxon photos survive
    map-tile eviction. A small JSON meta-index (url + attribution + license per taxon) persisted in
    the same cache re-hydrates `app.taxonPhotos` on boot (`loadTaxonPhotoIndex`) so photos stay
    referenceable offline across sessions.
  - **`fetchTaxonLineage`** now also returns `default_photo` (url via `toMediumImage` + attribution
    + license); **`checkTaxonUpdates`** fills photos opportunistically while it already crawls.
  - **Batched, resumable warm-up:** `scheduleWarmUp` rewritten to fetch **up to 30 taxa per Taxa-API
    request** (the endpoint accepts comma-separated IDs) at ~1.1s pacing — ~30× fewer calls, so a
    ~5,800-taxon set warms in **~3–4 min instead of ~100 min**. Skips already-warmed taxa (resumable
    across reloads, free for overlapping datasets); image bytes warm in a **separate bounded (6-way)
    background queue** so slow downloads never stall the metadata pass. Progress via the existing
    `#warmBar` + cancel; runs automatically on load.
  - **Attribution:** muted photographer/licence credit on the **focus-page** child tiles only (dense
    index grid stays clean); shown only when the tile is actually iNat's photo.
  - Verified end-to-end via headless Chrome + real iNat API on the sample CSV (warm-up runs,
    dedicated cache fills with images + meta key, tiles show iNat photos, meta-index re-hydrates on
    reload, console clean). **Still worth a real-dataset visual pass** — the sample's placeholder
    image URLs 404, so the `r._img` fallback couldn't be seen there; on real data tiles fill
    instantly and upgrade as warm-up runs.
- **Map toolbar flattened + dismissable status message** (commit `f2e6b8e`, **merged to `main`
  + pushed / live**): the map's Color-by/Draw-box/Clear-box/Full-screen/search controls dropped
  the last boxed `.pill` styling in the app — Color by now uses `.field`, the buttons and search
  use `.bar`/`.smallBtn`/`.mapSearchInput`, matching the sidebar/header convention exactly.
  `.pill` CSS (confirmed dead everywhere else) removed outright rather than left orphaned.
  Separately, `setStatus()` (`index.html:2593`) now builds a text + "×" structure (mirroring
  `.warmCancel`) instead of a bare text node, so persistent messages like the top-up-complete
  banner can be dismissed instead of sitting until overwritten. Verified via headless-Chrome CDP:
  real CSV load + Map tab in light/dark/375px-mobile, console clean, Draw box/Full screen/search
  still functional (only lost their wrapper box, not their listeners).
- **Phase 2, Step 1 — curated map palette + custom colours** (commit `82a454f`, **merged to
  `main` + pushed / live**): replaced the hash→HSL marker-colour generator with a designed,
  colour-blind-safe 8-hue categorical palette (light + dark, validated against the dataviz
  skill's checks), assigned stably by frequency (commonest category → slot 1, cycling past 8).
  Added `app.mapColorOverrides` (keyed `colorBy|category`); `markerColor` checks it before the
  ranked palette slot. Legend swatches are editable — click/Enter a dot opens a native colour
  picker, live-recolours markers + legend, with a "Reset" affordance per colour-by mode.
  Source-reviewed + parse-checked; **live testing surfaced three items** (map toolbar styling,
  offline image coverage, dismissable top-up message) — the first and third are now shipped
  above; offline image coverage (Field Guide photo source) is the remaining "Start here next."
- **Three decided UI changes** (commit `1c5f583`, **merged to `main` + pushed / live**):
  - **Field Guide lands on Kingdom.** `rankIdx` fallback `3 → 0` (`index.html:3297`); a fresh
    Field-Guide visit (no prior drill, `app.guideRank` null) now opens at Kingdom.
  - **"Load new…" moved into Add Records on mobile.** `syncHeaderLayout()` now moves `.headerMeta`
    to the top of the Add Records body (`#addRecordsBody`) instead of `#drawerActions`, so Snapshot
    leads the drawer; node moved (listener kept); desktop path unchanged; empty `.drawer-actions`
    hidden via `:empty` so no gap remains.
  - **Viridis Dates heatmap.** `heatColor()` (`index.html:5057`) swapped from the stale monochrome
    warm-grey ramp to a truncated viridis scale (empty `#EAEDF0`/`#1F2329`; 1–20 `#2A788E`; 21–50
    `#22A884`; 51–74 `#44BF70`; 75–99 `#7AD151`; ≥100 `#FDE725`). Out-of-year fill + ≥100 border in
    `renderDates` made faint cool-neutral + theme-aware. No brown left.
  - Served/loaded clean (HTTP 200); source-reviewed. **Real-browser pass still recommended** —
    Field Guide → Kingdom tiles; phone (375px) drawer Snapshot-first + "Load new…" in Add Records
    opening the picker; Dates grid teal→green→gold in both themes with day-click filter intact.
- **Sidebar reorg → cool-neutral redesign → serif wordmark** (branch `sidebar-reorg-ui-polish`,
  plan `wild-churning-globe.md`; **merged to `main` + pushed / live**). Three passes:
  - **Reorg + three requested fixes.** Compare users pulled into its own panel (teal/terracotta
    A/B swatches + a "Clear comparison" link via `#cmpClear`/`syncCmpClear()`); removed the
    chip-bar "Clear all" (+ orphaned `clearAllFilters()` / `.chip-clear`); Field Guide focus-
    header buttons made uniform (`.smallBtn` ink/`border-box`/no-underline; `↩`→SVG chevron);
    breadcrumb clicks now filter Records in the record modal **and** map popup.
  - **Cool-neutral "gallery" redesign.** Neutral ramp shifted off warm cream to cool near-neutral
    (light + dark). **Snapshot** is now a **persistent typographic header** (no accordion/boxes;
    lighter `--ink-2` figures) — order **Snapshot · Filters · Dates · Compare users · Add
    records**. The A/B/Shared bar became a stacked **species lens** in the Compare panel
    (`#cmpLens` / `renderCompareLens()`), replacing the pill-in-pill `cmpBar`. Tighter collapsed
    rhythm, refined carets, "Date"→"Dates".
  - **Serif wordmark.** Masthead lockup + onboarding `.mark` use `--wordmark` = **Literata**
    (`font-optical-sizing:auto`; Fraunces tried first but fragile small). Reserved exception to
    the one-typeface rule; UI stays Inter. `sw.js` precaches Literata (`CACHE_STATIC` → `v2`).
  - Verified light + dark, desktop + phone (375px) + panels; console clean. Map-popup breadcrumb
    is source-verified (canvas renderer → markers not DOM-clickable headless; 2-line mirror of
    the tested modal path).
- **Sidebar / header cleanup** (plan `we-are-going-to-declarative-hearth.md`, Parts 1–4):
  removed the Lightroom metadata engine; slimmed the header (Update-taxa → sidebar, Reset
  removed); **fixed the mobile drawer scroll** (explicit `100dvh`/`border-box` + JS body
  scroll-lock; real-iPhone sign-off received); **flattened the sidebar** into hairline sections
  (FILTERS · COMPARE USERS · DATE · SNAPSHOT · ADD RECORDS).
- **Full 10-rank taxonomy backbone** + seven navigation improvements (`lineageArrayFromRow`
  returns 10 ranks; positional tree keys; `backfillAncestors`; full Field Guide drill-down).
- **Service worker / offline** (`sw.js`, three caches) with per-taxon warm-up on import.
- **GBIF removed** everywhere (−1,372 lines; zero references).
- Phase 1 "Gallery" identity; Taxa tree redesign; Records card redesign; single-scroll-container
  refactor; active-filters chip bar; search relocation; Records ⇄ Field Guide hop.

## Settled decisions (don't re-litigate)

- Interface palette is a **cool near-neutral "gallery" ramp** (light + dark) — **not** warm cream.
  Photographs are the only colour; chrome stays quiet.
- **Wordmark is a serif (Literata)**, scoped to the masthead lockup + onboarding `.mark` via the
  `--wordmark` token — the **one reserved exception** to the single-typeface (Inter) system. Use
  `font-optical-sizing:auto` (no forced display `opsz`) so it stays legible small on phones.
  (Fraunces was rejected — its display cut went fragile at phone sizes.)
- Tab label stays **"Field Guide"** (Lily's call).
- **Records / Map / record-detail modal** use **each record's own photo only** (no multi-source
  cascade); honest placeholder when a taxon has no photographed record.
- **Field Guide tiles prefer iNaturalist's own `default_photo` per taxon** (Taxa API, keyed by
  `_taxonId`), **falling back to the record's own `r._img`** until warm-up resolves each tile (so the
  guide is never blank), then to the honest placeholder — **shipped 2026-07-05**, commit `4f9ec71`.
  Chosen because iNat's curated photos are better representative images and solve offline coverage +
  cross-dataset reuse (stable per `_taxonId`); the `r._img` fallback keeps tiles instant on large
  datasets. Muted photographer/licence credit shown on **focus-page tiles only**, and only when the
  shown image is iNat's. Warm-up is **batched (30 IDs/request) + resumable**. Records / Map /
  record-detail modal keep using `r._img` only, as before.
- Observer palette is the **12-hue theme-aware calm set** (`USER_PALETTE_LIGHT`/`_DARK`), all
  ≥5:1 on their own surface; observer marker is an **inline SVG crosshair** (⌖).
- **No GBIF** anywhere — not the UI, not the SW, not future phases, unless explicitly reintroduced.
- Publication map export = **clean vector / high-DPI, no basemap tiles**.
- Lily's own iNaturalist username may appear as a **placeholder example** — her observations are
  public and meant to be shared. Don't re-flag it.
