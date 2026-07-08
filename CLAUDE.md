# CLAUDE.md — iNat Lab

Project-level guidance, auto-loaded each session. This is the **specific truth for this
folder**; the workspace file at `~/Documents/Claude/CLAUDE.md` holds the broader working
philosophy (Explore → Plan → Code → Commit, biodiversity context, Lily's profile) — read
both. `docs/ROADMAP.md` holds the phased plan and `docs/NEXT-SESSION.md` the immediate next
actions + backlog. (Detailed session history lives in git; the Phase 1 creative briefs were
retired once shipped.)

## What this is

A single-file, **no-build, keyless static web app** for exploring iNaturalist records —
loaded from a CSV export *or* pulled live from the iNaturalist API — so Lily can interrogate
a species and a record set more smoothly and cleanly than iNaturalist itself allows, and run
her **imaging / metadata workflow** (record titles, keywords, taxonomy sync) over them. It is
**live on GitHub Pages** (`Lily-LMK/iNat-Lab`).

- `index.html` — the entire app (~7,000 lines: HTML + CSS + JS inline). No framework, no
  build step. CDN deps: **Inter** (UI) + **Literata** (masthead wordmark only) via Google Fonts,
  **Leaflet 1.9.4**, **esri-leaflet 3.0.12**.
- `sw.js` — a service worker that caches the **app shell** so the page loads offline once
  visited. Data is never cached — only the shell.
- Data is **never bundled** — it arrives at runtime. `.gitignore` blocks `*.csv` / `*.numbers`
  so personal exports never land in the public repo.

Five views: **Records, Taxa, Field Guide, Dates, Map** — plus a record-detail modal and a
generic CSV export modal.

## Current capabilities

- **Ingest:** CSV upload (`#csvA`) and live **iNat API top-up** (`#fetchApi`) by username(s)
  and/or project, with a top-up / full-import mode and a result cap.
- **Filter cascade:** kingdom → phylum → class → order → superfamily → family → subfamily →
  tribe → genus → species, plus user, quality grade, date range, and free-text search. Active
  filters render as a **chip bar** in the header; removing a chip (its ×) clears that filter, and
  x-ing a parent taxon chip cascades to its descendants. *(The old chip-bar "Clear all" /
  `clearAllFilters()` was removed in the sidebar reorg — don't reintroduce them.)*
- **Snapshot as navigation:** the four sidebar Snapshot figures are jump-off links (`.statLink`).
  **Records** → Records view; **Orders / Families / Species** → the Field Guide **"Browse by"
  index** at that rank, scoped to the current filter lens (`openGuideIndex()` + the
  `app.guideForceIndex` flag). Browse-by works **even when a taxon filter is active** — the Guide
  Index renders when `!focus || app.guideForceIndex`, with a "Back to {focus}" escape.
- **A/B user comparison:** two users coloured teal (`--user-a`) / terracotta (`--user-b`)
  across badges, snapshot tiles, and map points. Observers use a theme-aware **12-hue palette**
  (`USER_PALETTE_LIGHT`/`_DARK`).
- **Record metadata:** the record-detail modal produces a **Title** and **Keywords** at fixed
  default formats (Copy title / Copy keywords). **"Update taxa"** (`#taxonSyncBtn`) reconciles
  taxonomy against iNaturalist; taxon/photo enrichment fills breadcrumb ancestors and modal
  images. *(The old "Lightroom" title/caption/keyword dropdowns and GBIF common-name enrichment
  were removed — do not reintroduce them.)*
- **Common (vernacular) names:** rank-appropriate iNaturalist `preferred_common_name` (Australian
  English) in Records cards, the Field Guide (index tiles, focus header, child tiles), and the
  Taxa tree. Harvested with the photo warm-up (taxon + full ancestry, keyed `"rank|lowername"` in
  `app.taxonCommon`), with a **baked seed** (`TAXON_COMMON_SEED`) for fast first-render coverage
  and a **climb-up fallback** (unnamed taxa borrow the nearest ancestor's name up to Order; the
  Taxa tree shows own-names only). Source: iNat only, verbatim — no curated dictionary.
- **Map:** Leaflet + esri-leaflet; **Streets (OSM) / Topo (OpenTopoMap) / Satellite (ArcGIS) /
  Esri Topo / GA Surface Geology** basemaps, with click-to-identify on the geology layer. Points
  are coloured **by a chosen taxonomic rank or by user**, with a live legend (see Phase 2).
  **"Export map"** produces a print-ready figure in two modes: a **screenshot** of the real
  rendered map (basemap tiles + points + legend, PNG, CORS-safe basemaps only) or a **clean
  vector plot** (SVG + high-DPI PNG, no basemap tiles, always light-palette).

## Roadmap / where this is going (see `docs/ROADMAP.md`)

**Phase 1 — the "Gallery" editorial identity** (light default, hairline/monochrome UI so
photographs are the colour, opt-in dark theme) is **shipped and is the baseline.** Since Phase 1
the identity evolved: the neutral ramp moved off warm cream to a **cool near-neutral "gallery"
palette** (light + dark), and the masthead wordmark uses a **serif (Literata)** against the
Inter UI — the one reserved exception to the single-typeface system (everything else stays
Inter). Remaining phases:

1. **Phase 2 — Map by taxonomic rank.** (a) **curated colour-blind-safe palette with
   per-category custom colours** and (b) **publication export** (map screenshot + clean vector
   plot, see "Current chapter") are **shipped**. Remaining: (c) **clustering + spiderfy**
   (Leaflet.markercluster), back-burnered, offline not required.
2. **Phase 3 — Species deep-dive panel** (Wikipedia description, rank-appropriate common names,
   representative image, external links).
3. **Phase 4 — Spatial context layers** (IBRA/IMCRA bioregions, LGAs, geology, elevation).
4. **Phase 5 — Publish polish:** shareable URL state, real onboarding / empty / loading / error
   states, and an accessibility + mobile + performance pass.

## How to run / verify

No build. Serve the folder over http (not `file://`) so `fetch` and CORS behave:

```bash
python3 -m http.server 8000      # then open http://localhost:8000
```

…or VS Code **Live Preview**. Verify by clicking the real UI and watching the browser
console + network tab. Because the app is data-driven, keep a small **non-personal** sample
CSV handy (`sample-inat.csv`, git-ignored) for local testing — do not commit it.

## Conventions / house rules (inherited from the workspace + QM Explorer)

- **Single static file, no build.** Add libraries via CDN. Keep it self-contained and
  deployable to GitHub Pages (plus `sw.js`).
- **Keyless.** No API keys in client code; use only public/anonymous endpoints
  (iNaturalist, Wikipedia, and public spatial services).
- **Responsible API use.** Cache in-page, throttle, and **lazy-load** (resolve only what's
  visible — mirror QM Explorer's IntersectionObserver + bounded-pool pattern). Public
  services are fragile; never burst hundreds of requests.
- **Scientific integrity.** Preserve identifiers (iNat observation IDs, taxon IDs, UUIDs);
  separate evidence from inference; show provenance + attribution on every enriched value;
  make common names **rank-appropriate** (a family tile shows the family's name, not a random
  species'); a blank beats a mislabel.
- **Privacy (public app).** No private/personal data or hardcoded personal *defaults* in the
  repo; sample/placeholder text only. *(Exception, agreed with Lily: her own iNaturalist
  username may appear as a placeholder example — her observations are public and meant to be
  shared. Don't re-flag this.)*
- **Accessibility (WCAG 2.1 AA).** Keyboard nav, visible focus, labels, modal focus trap,
  honour `prefers-reduced-motion`. Accessibility is part of quality, not decoration.
- **Mobile-first.** Must load and work flawlessly on a phone: touch targets, responsive
  layout, no horizontal overflow, map usable on small screens.
- **Honest UI states.** Clear loading / empty / error states; never disguise a failure.

## Git workflow

- `main` is the deployable/live branch. Branch for any non-trivial change
  (`git checkout -b <feature>`); keep `main` deployable.
- Small, focused commits with clear messages; verify in the browser before committing.
- Push only when Lily asks.

## Current chapter

**Most recent work — Common (vernacular) names** (branch `common-names`, 3 commits
`d116f74`→`d794c4b`, **merged to `main` at `d794c4b` and PUSHED / live**). Ports the *idea* of
QM Explorer's common names into iNat Lab, but not its machinery (no multi-API resolver, no curated
`_localVern` dictionary — iNaturalist has rank-appropriate common names natively). The reference
file `qm-explorer.html` was deleted after the port.

- **Harvest is free.** The photo warm-up's batch call `/v1/taxa/{ids}` already returns each taxon
  **with its full `ancestors` array, each ancestor carrying `preferred_common_name` at its own
  rank** — so one existing request yields the whole lineage's names, no extra calls. `app.taxonCommon`
  is a `Map` keyed **`"rank|lowername"`** (homonym-safe; `RANKS[i][0].toLowerCase()` already equals
  iNat's ancestor rank strings, so harvest and lookup keys line up). Helpers `commonKey`,
  `commonNameFor(rankIdx, name)`, `harvestCommonNames(results)` (~`index.html:2917`). Persisted under
  a synthetic key **inside the existing `TAXON_PHOTO_CACHE` bucket** (`loadTaxonCommonIndex`/
  `saveTaxonCommonIndex`) — **no `sw.js` change** (bucket already in the activate keep-set).
- **Australian English, verbatim.** Warm-up URLs carry `INAT_LOCALE_PARAMS =
  "locale=en&preferred_place_id=6744"` (6744 = Australia; e.g. *Apis mellifera* → "European Honey
  Bee"). Names shown exactly as iNat gives them, in a muted secondary line; **blank when iNat has
  none** (house rule — a blank beats a mislabel), except the climb-up below.
- **Baked seed for instant coverage.** `const TAXON_COMMON_SEED` embedded in `index.html`
  (~3,300 names, ~48 KB gzipped) harvested from Lily's main export, merged into `app.taxonCommon`
  at boot **only where a key is absent** (durable cache + live warm-up, both fresher, win), so
  common names show on the **first render, offline, before any warm-up**. Public taxonomy only.
  Regenerate with committed **`tools/build-common-seed.mjs <export.csv> [out.json]`**.
- **Climb-up fallback (→ ~100% coverage).** When a taxon has no common name of its own, borrow the
  nearest **ancestor's up to Order** (`climbCommonName`/`climbCommonNameForRow`, ceiling = RANKS
  idx 3 — order names like "Decapods"/"Beetles" stay meaningful; class/phylum/kingdom too generic).
  Applied to Records cards, Field Guide index tiles, focus **header** (the `.guideSubtitle` — now
  fixed to render + climb, so a tribe/genus header shows scientific **and** common name), and focus
  child tiles. Genus *Tubuca* (unnamed) → tribe "Indo-West Pacific Fiddler Crabs". The **Taxa tree
  deliberately does NOT climb** (each node shows its own name; the tree already displays the full
  lineage, so climbing would repeat a parent's name onto children). Lily confirmed this call.
- Verified headless-Chrome **offline (seed only)** on the real export: ~100% first-page Records
  coverage, 115/120 family tiles named, Tubuca card + header show the fiddler-crab name, tree stays
  clean, light/dark/375px + header screenshot confirmed, console clean. **Gotcha:** the git-ignored
  `sample-inat.csv` has **fabricated taxon_ids** (id 43584 = *Homo sapiens*, not "Koala"), so common
  names only truly verify against real exports with valid ids.

**Earlier — Scope-aware API top-up** (branch `scope-aware-topup`, 5 commits
`0f8f542`→`15b3687`, **merged to `main` at `9a4d289` and PUSHED / live**). Fixes top-up grabbing
records the CSV's filter would have excluded. A CSV export is only the *rows that passed a filter*; the filter (place, "no plants",
grade, observed-date window) isn't in the file, so a username+date top-up pulled out-of-scope
records (a tracked observer's overseas trip). The fix captures that filter once and replays it as
real iNaturalist API params on every fetch.

- **`app.apiQuery` constraint set + a confirm gate.** The first API fetch on a dataset opens a
  **"Top-up scope"** modal (`#scopeModal`) instead of fetching — nothing is applied silently.
  The modal has a **sticky footer** with two buttons: **Save & start top-up/import**
  (`#scopeConfirm` — writes `app.apiQuery` *and* runs `runApiFetch(mode)`; label tracks
  `#apiMode`) and **Save scope only** (`#scopeSave` — writes scope, no fetch). Later fetches with
  a scope set run straight from the panel **Top-up** button (edit any time via **Set / edit
  scope…** `#apiScopeBtn`). `loadCSVFile` resets `app.apiQuery=null` per dataset and seeds an
  editable suggestion (`app.apiQuerySuggested`). *(The confirm button is the "start" action —
  Lily flagged that an earlier single "Confirm scope" button below the fold gave no obvious way
  to begin the fetch; hence the sticky footer + explicit start label.)*
- **Inference is a suggestion, not silent truth.** `inferApiConstraints()` scans `app.rows` for
  present iconic taxa (pre-ticked, ✓-marked), a homogeneous grade, and a padded bbox — but the
  **bbox is opt-in / unticked by default** (a rectangle round current points would silently drop
  a legitimate new record just outside; a real `place_id` is offered as the accurate path). All
  13 iconic groups are shown so an in-scope-but-unseen group (a first fungus under "no plants")
  stays tickable.
- **Paste the Export *Query* (not a URL).** iNat's Export page shows a raw **Query** string, so
  `parseInatQuery()` handles bare query strings, PHP-array keys (`iconic_taxa[]`, `projects[]`,
  `has[]`), comma `user_id=a, b`, a leading "Query" label + trailing "Columns …" block; it also
  fills the panel Usernames/Project. `applyApiQueryParams()` forwards
  iconic_taxa/place_id/without_taxon_id/taxon_id/quality_grade/bbox (**place wins over bbox**)
  /d1/d2/extra (captive, geoprivacy, taxon_geoprivacy, verifiable, photos). `describeApiQuery()`
  echoes the applied scope on the status line.
- **Two date axes (Lily's choice).** Observed range `d1`/`d2` (from the query; To-blank = up to
  now) is forwarded as a filter. **"Uploaded since"** owns the top-up cutoff (`created_d1`):
  `undefined` = automatic/advancing CSV cutoff (default); a date = fixed floor; **`""` = backfill**
  (no upload cutoff — pulls older in-scope records already on iNat, for the "I added plants
  later" case). `fetchObservationsDelta`'s `created_d1` is now optional. **Confirmed for Lily:**
  top-up already keys off *upload* date, so a year-old observation uploaded since the CSV is
  already fetched; backfill only adds records uploaded *before* the CSV that are newly in scope.
- Verified: **42/42** pure-helper unit tests (incl. all three of Lily's real example queries) +
  **30/30** headless-Chrome CDP flow (gate-vs-fetch, query paste fills every field incl.
  dates+users, delta URL carries every scope param, opt-in bbox, backfill drops `created_d1`,
  empty scope = back-compat no params), console clean; light+dark modal screenshots good. Same
  CDP gotchas as before (IIFE → monkey-patch `window.fetch` + assert via DOM;
  `Network.setBypassServiceWorker` **and** `setCacheDisabled` or the stale shell/old file is
  served). Plan: `~/.claude/plans/we-re-working-in-inat-effervescent-crown.md`.

**Follow-up fix (same day — branch `api-upper-taxon-ranks`, commit `53c775b`):** API-imported
records were missing every taxonomic rank **above Order** (Kingdom/Phylum/Class/Superfamily blank,
so invisible to those filter dropdowns, the Taxa tree, and Field-Guide Browse-by; breadcrumbs
started at Order). `obsToRowObj` (~line 6954) only emitted `taxon_order_name`…`taxon_species_name`;
added the four upper ranks via the existing `rankFromTaxon(taxon, "kingdom"|"phylum"|"class"|
"superfamily")`, reading the ancestry `enrichTaxaForObservations` backfills before merge (CSV
records were always fine — `buildRowObj` spreads all 10 ranks). Superfamily is often blank in iNat
ancestry — correct. Verified against the **live iNat API** (real full import populates the
Kingdom/Phylum/Class filters + a full record breadcrumb; 7/7) plus 42/42 + 36/36 stubbed suites.
**Next:** Phase 2 (c) clustering + spiderfy (back-burnered).

**Earlier — API ingest fixes: incremental import, top-up date-filter fix, map-box
clear** (branch `api-incremental-import`, commits `60f9e06` + `78d108c`, **merged to `main`
and pushed / live**). Behaviour fixes Lily requested plus related correctness work, all in
the API fetch / data-load paths:

- **Top-up no longer strands a stale date filter.** `topUpFromApi()` used to force `#dateTo`
  to today while leaving `#dateFrom` at the old CSV minimum; after the merge the stale range
  read as an active Date chip that hid the new records. Both date inputs now clear at top-up
  start and the existing `refreshStaticFilters()` repopulates them with the new full span —
  all records visible, no chip, other filters untouched.
- **Records appear as they're fetched.** Both fetchers (`fetchObservationsByUsers` /
  `fetchObservationsDelta`) deliver each 200-record page via a new `onBatch` callback (the
  full-import `onProgress` was dead — never called — so even the status line used to freeze);
  `loadFromApi`/`topUpFromApi` merge pages as they arrive (persistent `byId` dedupe map,
  shared `mergeApiObservations`/`finalizeDataMerge` helpers) and render after the **first
  page, then every third** (~5–7 s apart; fetch order is observed_on-desc so interim renders
  append below the fold — no flashing). Filter reset moved **before** the loop; derived lists
  + date-span inputs refresh once at the end. Field Guide warm-up untouched (single render at
  end-of-pass stays).
- **Related correctness:** `app.csvMaxCreatedAtTms` (top-up cutoff) now advances after API
  merges (max created_at on top-up; import-start time on a fresh full import — so top-up
  after a pure API import no longer skips the intervening window); full-import fetcher gained
  the 3-attempt 429 backoff; a mid-import page failure keeps merged pages with an honest
  "Import stopped after N records" status (page-1 failure on fresh import keeps onboarding);
  in-flight guard on `#fetchApi` (disabled + `aria-busy`) blocks double-click interleaving;
  dropped the pre-merge sort of fetched rows (nothing reads `app.rows` order — display order
  comes from `recompute()`'s `filteredIdx` sort).
- **Map region box no longer survives a dataset replacement** (commit `78d108c`). A drawn
  region box (`app.mapBox`) used to persist through a full API import and a fresh CSV load,
  silently hiding new records with **no chip to reveal it** (same trap as the stale date
  filter). New `clearMapRegionBox()` helper runs in `loadFromApi`'s up-front filter reset and
  in `loadCSVFile`; top-up deliberately keeps the box (an active box is part of the user's
  lens, like a taxon filter).
- **Top-up cutoff semantics confirmed correct — no change needed.** Lily asked to check that
  top-up grabs records *uploaded* since the CSV cutoff, not just *observed* since. It already
  does: the delta fetch sends only iNaturalist's `created_d1` (upload/created date, from the
  CSV's max `created_at`, day-inclusive) — no observed-date params anywhere in that path. Late
  uploads of old observations were always fetched; the stale date filter (now fixed) was what
  hid them.
- Verified via headless-Chrome CDP with a **stubbed iNat API** (the app JS is inside an IIFE,
  so tests monkey-patch `window.fetch` and assert through the DOM; CDP must
  `Network.setBypassServiceWorker` or `sw.js` serves the *cached* shell to tests): 26/26
  assertions across incremental render, stale-date fix, partial-failure recovery, modal +
  mid-import filter survival, advanced `created_d1`, double-click guard, plus 11/11 on the
  map-box clear (box drawn via synthetic mouse events — the rectangle renders to **canvas**,
  so assert on Clear-box visibility + record counts, not SVG paths); console clean.
  Known/accepted: interim renders close an open map popup (~every 5–7 s during an import).

**Earlier — Snapshot navigation + Browse-by within filters, and a Field Guide warm-up
flash fix** (on `main`, pushed / live). Two related pieces plus a small earlier fix:

- **Field Guide warm-up flash fixed** (commit `c83ab8e`). `scheduleWarmUp()` was calling
  `render()` after **every** photo batch (~1.1s); `render()` rebuilds the whole Field Guide
  (`view.innerHTML = ""`), recreating every `<img>`, so the guide flashed ~once a second while
  photos fetched. Removed the per-batch render (kept the single end-of-pass `render()` in the
  `.then()`); tiles hold their `r._img` fallback and fill with iNat photos in one repaint when the
  pass finishes. Trade-off: no progressive fill mid-pass — the **progressive-fill-without-flash**
  follow-up (a targeted `patchGuidePhotos()` DOM patch instead of a full render) is specced and
  ready in `docs/NEXT-SESSION.md` → visual-polish backlog; Lily chose the simple version first and
  asked to keep the patch option easy to reach for. Note: an **API top-up already re-triggers
  warm-up** and only fetches taxa not already in `app.taxonPhotos`, so **new species from a top-up
  are picked up incrementally** — no extra wiring.
- **Snapshot tallies became navigation, and Browse-by now works under an active taxon filter.**
  The four sidebar Snapshot figures are buttons (`.statLink`: quiet persistent hairline underline
  that firms up on hover/focus, theme-aware, keyboard-focusable): **Records** → Records view;
  **Orders / Families / Species** → the Field Guide **"Browse by" index** at rank 3 / 5 / 9,
  scoped to the current filter lens, via `openGuideIndex(rankIdx)` (sets the new
  `app.guideForceIndex` flag + `guideRank`, clears `guideScopeOrder`, `setTab("guide")`). Species
  lands on browse-by **Species** = one card per species in the set (the "one of each species"
  result — the only variant that works from any filter state, since the focus-page species plate
  needs a single focus taxon). Previously the Guide Index (and its Browse-by rank pills) vanished
  the moment any **taxon** filter set a focus; `renderGuide` now renders the index when
  `!focus || app.guideForceIndex`, so you can browse the *filtered* set by rank without dropping
  the filter. When a focus exists the index crumb shows a **"Back to {focus}"** link
  (`#guideExitForceIndex`) so the mode isn't a trap; the flag resets on a taxon drill
  (`applyLineageKey`) and on a **direct** Field Guide tab click (fresh entry → normal focus page).
  Verified end-to-end on `sample-inat.csv` (headless Chrome): all four links; browse-by inside an
  `Insecta` filter; Back-to-focus; tab-reset; tile-drill → focus page; light + dark; console clean.

**Earlier — Map publication export** (commit `3e7297a`, **merged to `main` + pushed /
live**). Written brief at `~/.claude/plans/hi-opus-please-familiarise-enumerated-lemur.md` specced
a single **clean vector** figure (points + legend, no basemap tiles, always light-palette) — Lily
reviewed the actual rendered output mid-session and asked to see the real map instead, so the
feature shipped as **two modes** rather than a straight rebuild:

- **Map screenshot (PNG)** — `captureMapScreenshot()` captures the *actual* rendered Leaflet map
  (basemap tiles + coloured points + legend + caption) by drawing loaded tile `<img>`s and
  overlay imagery onto an offscreen canvas at their live on-screen position, then drawing points
  fresh via `latLngToContainerPoint` + `markerColor` (live theme colours — this mode is literally
  "what you see is what you get", unlike the vector mode). **Restricted to CORS-friendly
  basemaps** (`CORS_SAFE_BASEMAPS`: Satellite / Esri Topo / Geology — the Esri/GA ArcGIS REST
  services, now given `crossOrigin: true`); OSM/OpenTopoMap tiles don't send CORS headers and
  would taint the canvas, so the popover shows an honest inline message instead of a broken
  export. `waitForTilesLoaded()` lets a "data bounds" extent pan/zoom the map, wait for tiles,
  capture, then restore the original view.
- **Clean vector plot (SVG + high-DPI PNG)** — `buildMapSVG()` + `svgToPNG()`, the original
  brief's figure: projects points via `crs.project` (no tiles), always white-ground/light-palette
  regardless of the app's theme via `withLightTheme()` (a synchronous temporary `data-theme` swap
  so `markerColor`/`taxonPaletteHex` return light-palette hex verbatim — overrides and user
  colours included — restored before the next paint, no visible flash). Kept as a second option
  since it's still a legitimate theme-independent "journal figure" format, and it was already
  built + tested before the mid-session pivot.
- Both modes share **Extent** (data bounds / current view) and **include-legend** controls in the
  export popover, and pull colours from `markerColor`/`categoryKeyFor`/`_catRank` — the same
  functions the live map uses — so custom legend overrides and per-user colours always match the
  on-screen map exactly. Honest **omitted-no-coordinate** count in the caption either way.
- **Trigger UI:** an `#mapExport` button in the map toolbar opens a small fixed-position popover
  (`.mapExportPopover`) — keyboard-trapped (Tab cycles within it), Escape closes and returns focus
  to the button, closes itself if orphaned by a tab switch or map re-render (`mapState._closeExportPopover`).
- Verified end-to-end via headless-Chrome CDP against `sample-inat.csv`: custom colour override
  carries through to both circles and the legend swatch; zero-point and single-point extents
  don't NaN/crash; screenshot mode visually confirmed against real Esri satellite tiles of Mount
  Nebo; light/dark/375px all clean, console clean throughout.

**Earlier — Field Guide → iNaturalist representative photos**
(`~/.claude/plans/we-re-in-planning-mode-cheeky-moonbeam.md`). Branch
**`field-guide-taxon-photos`**, commit `4f9ec71`, **pushed; not yet merged to `main`**. The Field
Guide now illustrates each taxon with iNaturalist's curated `default_photo` (Taxa API, keyed by
`_taxonId`) instead of a photo from the loaded dataset, **falling back to the record's own `r._img`**
until warm-up resolves each tile so the guide is never blank (Lily's call after a blank-guide
regression — a strict upgrade over the old record-photo tiles). Records / Map / record-detail modal
are untouched (`r._img` as before).

- **Storage:** a dedicated durable `CACHE_TAXON_PHOTOS` SW bucket, checked **before** the shared
  `CACHE_IMG` in the fetch handler so warmed photos survive map-tile eviction. A JSON meta-index
  (url + attribution + license) persisted in the same cache re-hydrates `app.taxonPhotos` on boot
  (`loadTaxonPhotoIndex`) — offline-durable across sessions.
- **Data:** `fetchTaxonLineage` also returns `default_photo`; a new `fetchTaxonPhotosBatch` fetches
  **up to 30 taxa per request** (comma-separated IDs). `scheduleWarmUp` rewritten to batch at ~1.1s
  pacing (~30× fewer calls: ~5,800 taxa in ~3–4 min, not ~100), skip already-warmed taxa (resumable),
  and warm image bytes in a **separate bounded 6-way queue** so slow downloads don't stall the pass.
  `checkTaxonUpdates` fills photos opportunistically. Auto-runs on load via `#warmBar`.
- **Rendering:** `renderGuide` index + focus tiles use taxon photo → `r._img` → placeholder; muted
  `.fgCredit` photographer/licence line on **focus-page tiles only**.
- **Durability follow-up** (commit `42fe03c`, on `main`): `navigator.storage.persist()` requested
  once on boot (after `persisted()`) so the offline photo cache resists eviction — origin-wide,
  console-logged, no UI chrome. README gained an **"Offline & caching"** section (three Cache
  Storage buckets + DevTools confirmation steps).
- Verified end-to-end via headless Chrome + real iNat API on the sample CSV (console clean, cache +
  meta-index correct, hydration on reload). Real-dataset visual pass still recommended (the sample's
  placeholder image URLs 404, hiding the `r._img` fallback).

**Earlier — sidebar reorg → cool-neutral redesign → serif wordmark**
(`~/.claude/plans/wild-churning-globe.md`). Branch **`sidebar-reorg-ui-polish`**, **merged to
`main` and pushed** (live on GitHub Pages). Three passes:

1. **Reorg + three requested UI fixes.** Sidebar reordered; Compare users pulled into its own
   panel with teal/terracotta A/B colour swatches (`--user-a`/`--user-b`) beside the Compare A /
   Compare B labels + a quiet **"Clear comparison"** link (`#cmpClear` / `syncCmpClear()`, shown
   only when both are set). Removed the chip-bar **"Clear all"** and its orphaned
   `clearAllFilters()` + `.chip-clear` CSS (x-ing a parent taxon chip already cascades). Made the
   Field Guide focus-header buttons uniform (`.smallBtn` → `color:var(--ink)`,
   `text-decoration:none`, `box-sizing:border-box`, fixed `line-height`; emoji `↩` → inline SVG
   chevron). **Breadcrumb clicks now filter Records** (record modal **and** map popup), matching
   the record-card trail.
2. **Cool-neutral "gallery" redesign.** Shifted the shared neutral ramp off warm cream to a cool
   near-neutral palette (light + dark) so the photographs are the only colour. **Snapshot**
   became a **persistent, typographic header** (no accordion, no boxes; lighter `--ink-2`
   figures) — final section order **Snapshot · Filters · Dates · Compare users · Add records**.
   The A/B/Shared bar moved out of Snapshot into the Compare-users panel as a clean stacked
   **species lens** (`#cmpLens` / `renderCompareLens()`: hairline rows, colour dot + tabular
   count, active ink marker), replacing the old pill-in-pill `cmpBar`. Tightened the collapsed-
   section rhythm, refined the collapse carets, renamed the "Date" section to **"Dates"**.
3. **Serif wordmark.** The masthead lockup (`header .brand .title`) and onboarding `.mark` use a
   dedicated **`--wordmark`** serif — **Literata**, with `font-optical-sizing:auto` for legibility
   when scaled down on phones (Fraunces was tried first, but its display cut went fragile small).
   The one reserved exception to the single-typeface rule; the UI stays Inter. `sw.js` precaches
   the Literata URL (`CACHE_STATIC` bumped to `v2`).

**Earlier — the sidebar/header cleanup plan**
(`~/.claude/plans/we-are-going-to-declarative-hearth.md`), Parts 1–4, all shipped:

- **Part 1 — removed the Lightroom metadata engine** (three format dropdowns + dead code); the
  record modal keeps Copy title / Copy keywords at default formats.
- **Part 2 — slimmed the header:** "Update taxa" moved into the sidebar; "Reset" removed, with
  its logic extracted to `clearAllFilters()` for the chip-bar "Clear all".
- **Part 3 — fixed the mobile off-canvas drawer scroll.** Two root causes: the drawer was
  `box-sizing:content-box`, so its fixed `top:0/bottom:0` never bounded it → gave it explicit
  `height:100dvh` + `border-box`; and this app scrolls the **body** as its container, which iOS
  won't lock via `overflow:hidden` → added a JS `position:fixed` body scroll-lock in
  `openDrawer`/`closeDrawer`. Real-iPhone sign-off from Lily received.
- **Part 4 — flattened the sidebar** to quiet hairline sections (no nested boxes) and regrouped
  into **FILTERS · COMPARE USERS · DATE · SNAPSHOT · ADD RECORDS**.

Earlier chapters — the Phase 1 Gallery identity, the full 10-rank taxonomy backbone + seven
navigation improvements, search relocation, the active-filters chip bar, the Records ⇄ Field
Guide hop, the Field Guide rework, the Records card redesign, the single-scroll-container
refactor, and the Taxa tree redesign — are all shipped. See git history and
`docs/NEXT-SESSION.md` for detail.

**Next up:** Phase 2 (c), **clustering + spiderfy** (`Leaflet.markercluster`) — see
`docs/NEXT-SESSION.md` → "Start here next". Back-burnered relative to the rest of Phase 2;
offline/`sw.js` precache not needed. Standing decisions: tab label stays **"Field Guide"**; tile
images use own records only with an honest placeholder; publication export has **two modes** — a
real-basemap screenshot (CORS-safe basemaps only) and a clean vector plot (no basemap tiles,
always light-palette); **common names** are iNat-only, verbatim, Australian English, with a
climb-up fallback everywhere **except the Taxa tree** (own-names only) — see "Current chapter"
above and `docs/NEXT-SESSION.md` → "Settled decisions".
