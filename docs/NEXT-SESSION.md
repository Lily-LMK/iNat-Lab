# iNat Lab — Next session

The immediate-actions companion to `ROADMAP.md` (full phase plan) and `../CLAUDE.md`
(orientation + current chapter). Keep this lean: what to do next, the near-term backlog, and
the settled decisions a fresh session shouldn't re-litigate.

_Last refreshed 2026-07-05. Phase 2 Step 1 (curated map palette + custom colours) is **shipped**
(see Recently shipped). Testing that feature turned up three more items, fully specced below —
do these next, before Phase 2 Step 2._

---

## Start here next — three items from testing the map feature

Found while testing the new map colouring/legend work. House rules apply: single-file
`index.html`, **no build**; branch off `main`; verify in-browser **light + dark + mobile
(375px)**; console clean; focused commits; **don't push until Lily asks**. (Local test data: a
git-ignored `sample-inat.csv`.)

### 1 · Map toolbar still uses the pre-redesign `.pill` style

The map's own control bar (Color by / Draw box / Clear box / Full screen / location search) is
the last place still using the old boxed-chip look from before the cool-neutral "gallery"
redesign — bordered `.pill` containers (`var(--panel)` fill, `box-shadow`-free but still a
nested box) instead of today's flat, hairline convention used everywhere else.

- Markup: `renderMap()`, `index.html:4300-4327` — three `.pill`-wrapped groups (`Color by`
  select; Draw box/Clear box/Full screen buttons; the search pill).
- CSS: `.pill` base rules `index.html:213-263`, `.mapTop`/`.mapSearchPill` overrides
  `index.html:846-873`. **Confirmed via grep: `.pill` is used nowhere else in the app any more**
  (the header dropped it in the sidebar reorg) — so it's safe to fully repurpose/retire, not just
  patch around.
- Target style — match the current sidebar/header convention already in the file:
  - The "Color by" label+select → `.field` pattern (`index.html:376-395`): label above,
    `var(--field)` background, `var(--hair)` border, focus ring via `--accent-soft`. No wrapping
    box.
  - Draw box / Clear box / Full screen buttons → `.smallBtn` (`index.html:1156-1168`): flat,
    `var(--raised)` fill, `var(--hair)` border, `var(--raised-hi)` hover, no shadow. Group them in
    a `.bar` (`index.html:717-724`) instead of a `.pill` for spacing.
  - Search input → the same flat treatment as `.field input`/`.mapSearchPill input` already gets
    (keep the existing focus ring), just drop its `.pill` wrapper box.
- **Verify:** map toolbar reads as part of the same flat "gallery" system as the sidebar and
  header — no boxed chips — in light + dark + mobile; Color by / Draw box / Clear box / Full
  screen / search all still function (they're only losing their wrapper, not their listeners —
  keep IDs `#mapColorBy`, `#drawBox`, `#clearBox`, `#mapFS`, `#mapSearch`, `#mapSearchBtn`,
  `#mapStatus` unchanged since JS queries them by id).

### 2 · Field Guide photos: switch to iNaturalist's representative photo per species (decided)

**Decided with Lily:** Field Guide tiles will show iNaturalist's own curated `default_photo` for
each species (from the Taxa API) as the **primary** image source — online and offline, not just
an offline fallback — instead of a photo pulled from the loaded dataset. This also solves the
original "offline coverage is thin" + "reusable across datasets" complaint outright: the photo is
stable per `_taxonId`, not tied to any specific observation, so it's inherently shared across
overlapping datasets and never depends on which row happened to load first. Lily also wants a
small **photographer/licence credit** shown on the tile/detail view, since this is iNaturalist's
photo, not one of her own records.

- **Data source — no new API endpoint needed.** `fetchTaxonLineage(taxonId)` (`index.html:5731`)
  already calls `GET https://api.inaturalist.org/v1/taxa/{id}` and discards everything except
  ancestor rank names. The same response's `results[0].default_photo` (`{ url, attribution,
  license_code, ... }`) is sitting right there unused — extend `fetchTaxonLineage`'s return value
  (or add a sibling using the same fetch) to also capture
  `{ photoUrl: toMediumImage(default_photo.url), attribution: default_photo.attribution, license:
  default_photo.license_code }`. `toMediumImage()` already exists (`index.html:2345-2351`,
  upsizes iNat's `square`/`small`/etc. URL segment to `medium`) — reuse it, don't reinvent it.
- **Rate limits are the real constraint, not concurrency.** The existing `scheduleWarmUp()`
  (`index.html:2655-2726`) fetches known CDN photo URLs directly with 4-way concurrency — fine for
  plain image fetches, but hitting the iNat **Taxa API** per species is a different kind of
  request, and this app already throttles that endpoint deliberately: `checkTaxonUpdates()`
  (`index.html:5805-…`) sleeps **1100ms between requests** to stay within iNat's rate limits. A
  cold warm-up of a large species list (up to 5,000) making one API call per taxon at ~1/sec
  pacing could take **over an hour** — much slower than today's pure-image warm-up. Mitigate by:
  - Skipping any taxon whose photo is **already in the durable cache** before making the API call
    (see below) — re-warming an already-covered dataset, or loading a second overlapping dataset,
    then costs nothing for the taxa already secured. This is also what makes progress resumable
    across a reload/interruption, for free — no separate progress store needed.
  - Reusing the existing warm-up progress bar (`#warmBar`, `index.html:1966`) and its cancel
    control as-is — it already communicates a long background task.
  - Worth deciding during implementation whether this rides along with the existing "Update taxa"
    lineage-sync pass (`checkTaxonUpdates`) so the app isn't making two separate rate-limited
    passes over the same taxon list, or runs as its own pass off the same `_taxonId` list.
- **Durable, taxon-keyed storage — do NOT write into `r._img`.** `r._img` means "this record's own
  photo" per this app's data-integrity conventions (provenance matters — see CLAUDE.md). iNat's
  representative photo is a different kind of thing (curated/enriched, not observed), so it gets
  its own store: a dedicated `CACHE_TAXON_PHOTOS` service-worker bucket, sized independently
  (~5,500–6,000 entries) and **never sharing eviction with map tiles** (see the shared-`CACHE_IMG`
  eviction bug below — still worth fixing regardless of photo source), **plus** a small in-page
  index — e.g. `app.taxonPhotos = Map<taxonId, {url, attribution, license}>` — populated by the
  warm-up pass and consulted by the Field Guide tile renderer instead of `r._img`.
- **Rendering:** the Field Guide tile/detail image lookup switches from "representative row's
  `_img`" to "`app.taxonPhotos.get(taxonId)?.url`", falling back to the existing **honest
  placeholder** (unchanged convention) when a taxon has no iNat default photo yet (still warming,
  offline before the first warm-up, or the taxon genuinely has none on iNat). Show a small muted
  attribution line wherever the entry's `attribution` is present — same restrained treatment as
  other metadata in this app (`.muted`/`.small`), not a prominent badge.
- **Records / Map / record-detail modal are unaffected** — this change is scoped to the Field
  Guide's taxon representation only; those views keep showing the observation's own photo
  (`r._img`) exactly as today.
- **Still worth fixing regardless:** the existing image cache's shared eviction bug. Species
  photos and basemap tiles (OSM/OpenTopoMap/ArcGIS/GA geology — `sw.js:44-53`) currently land in
  the *same* bucket, `CACHE_IMG` (`sw.js:20`), with one flat `IMG_MAX_ENTRIES = 5000` FIFO trim
  (`sw.js:180-188`, oldest-inserted evicted first, regardless of type) — heavy map panning/zooming
  can quietly evict already-warmed taxon photos. The new `CACHE_TAXON_PHOTOS` bucket above sidesteps
  this for Field Guide photos specifically by design (separate bucket, separate budget).
- **Revises a settled decision** (see Settled decisions below): "tile images use each record's own
  photo only" now applies to Records/Map/modal views only — the Field Guide switches to
  iNaturalist's representative photo by design, with attribution.
- **Verify:** load a dataset, let warm-up run (or trigger "Update taxa"), confirm Field Guide tiles
  show iNaturalist's photos with a small credit line; confirm a second, overlapping dataset doesn't
  re-fetch photos for species already warmed; confirm offline browsing still shows warmed photos
  after heavy map use; confirm Records/Map/modal are untouched.

### 3 · Make the API top-up completion message dismissable

`setStatus()` (`index.html:2636`) writes into a persistent inline span, `#status`
(`index.html:1978`, in the tab bar; wraps to its own row on mobile via the `@media (max-width:
620px)` rule at `index.html:316-322`). Used for the top-up-complete message
(`index.html:6453-6457`: "Top-up complete: +N new, N updated…") among others — it has no
auto-dismiss and no manual close, so it sits there until the next status update overwrites it.

- **Do:** add a small "×" dismiss control next to the status text, shown only while there's a
  message, that clears it on click. Mirror the existing `.warmCancel` button already used for the
  cache warm-up progress bar (`index.html:2649-2652`) for a consistent pattern/markup style.
  `setStatus(msg)` currently does `$("#status").textContent = msg` — needs to build/update a small
  child structure (text + dismiss button) instead of a bare text node, and the dismiss handler just
  clears it (`$("#status").textContent = ""` or hide the wrapper).
- **Verify:** trigger a top-up (or any `setStatus()` call), confirm the × appears and clears the
  message on click without affecting the tabs or layout; mobile wrap behaviour (`620px` rule)
  still holds with the extra button in place.

Then Phase 2 Step 2 (clustering + spiderfy, `Leaflet.markercluster`) and Step 3 (clean vector /
high-DPI point-map export, no basemap tiles). See `ROADMAP.md` Phase 2.

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

- **Phase 2, Step 1 — curated map palette + custom colours** (commit `82a454f`, **merged to
  `main` + pushed / live**): replaced the hash→HSL marker-colour generator with a designed,
  colour-blind-safe 8-hue categorical palette (light + dark, validated against the dataviz
  skill's checks), assigned stably by frequency (commonest category → slot 1, cycling past 8).
  Added `app.mapColorOverrides` (keyed `colorBy|category`); `markerColor` checks it before the
  ranked palette slot. Legend swatches are editable — click/Enter a dot opens a native colour
  picker, live-recolours markers + legend, with a "Reset" affordance per colour-by mode.
  Source-reviewed + parse-checked; **live testing surfaced the three items above** (map toolbar
  styling, offline image coverage, dismissable top-up message) — now specced as "Start here next."
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
- **Field Guide tiles use iNaturalist's own `default_photo` per species** (Taxa API), not a photo
  from the loaded dataset — **revised 2026-07-05**, Lily's call, because it solves offline
  coverage + cross-dataset reuse cleanly (stable per `_taxonId`) and iNat's curated photos are
  simply better representative images. Shown with a small photographer/licence credit since it's
  not her own record. See "Start here next" #2 for the implementation spec.
- Observer palette is the **12-hue theme-aware calm set** (`USER_PALETTE_LIGHT`/`_DARK`), all
  ≥5:1 on their own surface; observer marker is an **inline SVG crosshair** (⌖).
- **No GBIF** anywhere — not the UI, not the SW, not future phases, unless explicitly reintroduced.
- Publication map export = **clean vector / high-DPI, no basemap tiles**.
- Lily's own iNaturalist username may appear as a **placeholder example** — her observations are
  public and meant to be shared. Don't re-flag it.
