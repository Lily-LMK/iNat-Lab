# iNat Lab — Next session

The immediate-actions companion to `ROADMAP.md` (full phase plan) and `../CLAUDE.md`
(orientation + current chapter). Keep this lean: what to do next, the near-term backlog, and
the settled decisions a fresh session shouldn't re-litigate.

_Last refreshed 2026-07-06. Phase 2 Step 1 (curated map palette + custom colours) and Step (b)
(map publication export) are both **shipped**. Next up is Phase 2 (c), **clustering + spiderfy**
— back-burnered, offline not required._

---

## Start here next — Phase 2 (c): clustering + spiderfy

House rules apply: single-file `index.html`, **no build**; branch off `main`; verify in-browser
**light + dark + mobile (375px)**; console clean; focused commits; **don't push until Lily asks**.
(Local test data: a git-ignored `sample-inat.csv`.)

**Goal:** add `Leaflet.markercluster` (CDN, keyless) so co-located iNat points (identical/near
coords are common) cluster and spiderfy on click, keeping dense top-ups readable and fast. Cluster
icons should colour by the dominant category, respecting the "Colour by" control and
`app.mapColorOverrides`. **Offline/`sw.js` precache is not needed for this** (Lily's call — she
doesn't need the map offline).

No further detail has been specced yet — start with a plan.

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

- **Map publication export** (commit `3e7297a`, **merged to `main` + pushed / live**). An
  **"Export map"** button + popover on the map toolbar, with two export modes (the original
  written brief specced a single no-basemap vector figure; Lily saw the bare-dots result and
  asked for the real map, so this shipped as two modes instead):
  - **Map screenshot (PNG)** — captures the *actual* rendered Leaflet map (basemap tiles +
    coloured points + legend + caption) via canvas. Restricted to CORS-friendly basemaps
    (`CORS_SAFE_BASEMAPS`: Satellite/Esri Topo/Geology — all Esri/GA ArcGIS REST services, now
    given `crossOrigin: true`); OSM/OpenTopoMap tiles don't send CORS headers, so instead of a
    silent failure the popover shows an honest inline message telling Lily to switch basemap
    first. Marker colours use the **live theme** (screenshot = "what you see is what you get"),
    unlike the vector mode below.
  - **Clean vector plot (SVG + high-DPI PNG)** — the original brief's figure: points + legend +
    caption, **no basemap tiles**, always white-ground/light-palette regardless of the app's
    theme (`withLightTheme()` temporarily swaps `data-theme` so `markerColor`/`taxonPaletteHex`
    return light-palette hex verbatim, restored before the next paint — no visible flash). Kept
    as a second option since it's still a legitimate theme-independent "journal figure" format.
  - Both share **Extent** (data bounds / current view) and **include-legend** controls, and pull
    colours from `markerColor`/`categoryKeyFor`/`_catRank` — the same functions the live map
    uses — so custom legend overrides and per-user colours always match the on-screen map
    exactly. Popover is keyboard-trapped (Tab cycles within it), Escape closes and returns focus
    to the button, closes itself if orphaned by a tab switch or map re-render.
  - Verified via headless-Chrome CDP against `sample-inat.csv`: custom colour override carries
    through to both circles and legend swatch; honest omitted-no-coordinate caption; zero-point
    and single-point extents don't NaN/crash; screenshot mode visually confirmed against real
    Esri satellite tiles of Mount Nebo; light/dark/375px all clean, no console errors.
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
- Publication map export = **two modes** (shipped 2026-07-06, commit `3e7297a`): a **map
  screenshot** (real basemap tiles, PNG, CORS-safe basemaps only) and a **clean vector plot**
  (SVG + high-DPI PNG, no basemap tiles, always light-palette). The original brief specced only
  the vector mode; Lily asked for the real map after seeing the bare-dots result, so the
  screenshot mode was added rather than replacing it. Don't re-litigate — see "Recently shipped".
- Lily's own iNaturalist username may appear as a **placeholder example** — her observations are
  public and meant to be shared. Don't re-flag it.
