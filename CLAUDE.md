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

- `index.html` — the entire app (~8,900 lines: HTML + CSS + JS inline). No framework, no
  build step. CDN deps: **Inter** (UI) + **Literata** (masthead wordmark only) via Google Fonts,
  **Leaflet 1.9.4**, **esri-leaflet 3.0.12**.
- `sw.js` — a service worker that caches the **app shell** so the page loads offline once
  visited. Data is never cached — only the shell.
- Data is **never bundled** — it arrives at runtime. `.gitignore` blocks `*.csv` / `*.numbers`
  so personal exports never land in the public repo.

Five views: **Records, Taxa, Field Guide, Dates, Map** — plus a record-detail modal and a
generic CSV export modal.

## Current capabilities

- **Ingest:** all via the **"Add records…" modal** (`#addModal`, opened from the header button /
  onboarding CTA), which has **two source tabs** — **From a file** (Replace *or* Add-to-current,
  `#csvA`; append merges deduped by observation id) and **From iNaturalist**. The iNaturalist tab is
  a **plain-English scope sentence** (`#scopeSentence`, observers · area · uploaded-since, with an
  "Also limited to…" tail for real restrictions) + **Preview count** (`#apiTest`, inline estimate) +
  one **context-aware Sync records** button (`#fetchApi`) + two disclosures: **Adjust scope**
  (Observers · Area · Uploaded since) and **More options** (project · taxa · grade · cap · observed-
  since · paste-Export-Query). Geography is on by default. **Update taxa** (`#taxonSyncBtn`) is a
  quiet maintenance footer. *(Streamlined 2026-07-10 — see "Recent work".)*
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

## Recent work

Newest first, and deliberately brief — **git history and commit messages hold the detail.** This
section is orientation, not a changelog. Everything below is on `main` and live unless noted.

- **Add records streamline — tabs, scope sentence, one smart button** (2026-07-10, branch
  `add-records-streamline`). A UX-lead pass over the ingest dialog (design critique → mockup → build,
  reviewed with Lily at each fork). (1) The two doors became **source tabs** (From a file / From
  iNaturalist), default tab context-aware (File when nothing loaded, else iNaturalist). (2) The
  routine top-up is now a **plain-English scope sentence** (`#scopeSentence`, rewritten live by
  `syncScopeSummary()`) — names the actual observers + area + upload boundary, with an "Also limited
  to…" tail only for genuine restrictions (`describeAdvancedScope()`; export boilerplate like
  has_photos/verifiable is left out) — plus an inline **Preview count** (`#apiTest` → `previewCount()`,
  replaces the old "Test" alert; honours the live scope + boundary). (3) **One smart Sync button**:
  `#fetchApi` routes to the big-cap full import when there's no baseline **or** the upload boundary is
  cleared (backfill), else an incremental top-up — decided by state, no mode toggle. **Full re-import
  button removed** (it only ever merged/deduped, never "replaced"). (4) Scope now always describes the
  **loaded data**: `loadCSVFileAppend` nulls `app.apiQuery` like replace does, so a stale captured
  Export Query can't describe a dataset it doesn't match (the reported "strange sentence" bug). (5)
  **Trimmed the panels**: dropped the Taxa helper lines, removed **Exclude taxon IDs** and **Observed
  to** (kept "Observed since"; both `without_taxon_id` and `d2` still round-trip from a pasted Export
  Query via `scopeWorking` and show in the sentence), emptied the paste-query instruction note, and
  shortened Update taxa's caption. (6) Each tab's primary now uses the real filled-ink `.btn-primary`.
  Verified light + dark + mobile 375px on the real 41,891-row export; Preview count + append driven
  live against the iNaturalist API; console clean.
- **Add records redesign — inline scope, Fern green rejected** (2026-07-10, merged to `main`).
  Reworked the whole ingest interface (design session
  first, forks agreed with Lily). (1) The `#scopeModal` modal-over-modal is **retired**: the scope
  now lives **inline** in `#addModal` — Observers · **Area** · **Uploaded since** up top for the
  routine top-up, with everything advanced (Project, taxa groups, quality grade, exclude taxa,
  observed-date window, paste Export Query, **Full re-import**) folded into a **More options**
  `<details>`. There's no confirm gate any more — `collectScopeFromModal()` reads the inline
  controls at fetch time; `refreshAddScopeFromData()` fills them on CSV load / append / modal-open.
  (2) **Geography is ON by default** — the Area radio defaults to a padded box round the data
  (`scopeWorking.bbox`), switchable to a place id or Anywhere; this **reverses** the old opt-in-off
  bbox decision (the fix for travelling observers dragging in out-of-area records). (3) **CSV
  append** — two doors, "Replace with a file…" and "Add a file to current…" (`loadCSVFileAppend`,
  deduped by observation id, same merge path as an API top-up; `app._csvMode` routes the shared
  `#csvA` handler). (4) **Uploaded since gets a Clear button** (blank = backfill). (5) UI wording
  is **"iNaturalist"**, not "iNat". (6) **No accent colour** — a Fern-green primary was trialled
  and **rejected** by Lily; the chrome stays ink/white/grey (content + type are the design). Form
  controls now use `accent-color: var(--ink)` so radios/checkboxes tick ink, not the browser's
  blue. Verified light + dark + mobile 375px, console clean; append add/dedupe and area/clear
  preview driven live.
- **Add records modal + collapse fix** (2026-07-10). The header **"Add records…"** button now
  opens a single dialog (`#addModal`) with three doors — **From a file** (Load CSV), **From
  iNaturalist** (the top-up/import controls, moved from the sidebar with their ids intact so
  handlers bind unchanged), and **Maintenance** (Update taxa, under a divider). This retires the
  old sidebar "Add records" accordion and the `syncHeaderLayout` mobile header-relocation hack;
  onboarding routes to the same modal; the modal closes on load/import so the view is visible; the
  scope editor (`#scopeModal`) still opens on top with its own focus trap. Also fixed the reported
  **collapse bug**: once the page is tall the sticky sidebar becomes an internal-scroll container,
  and its last panel sat flush against the scroll-clip edge (hit-testing as the `<aside>`, so it
  wouldn't toggle) — `padding-bottom` + `scroll-padding-bottom` on `aside` clear it. *(The scope
  model/semantics inside the modal are deliberately unchanged — the next focus.)*
- **Field Guide: stable per-taxon photos** (2026-07-10). Higher-rank tiles (phylum, class,
  order, family…) now show iNaturalist's own `default_photo` for *that* taxon, not the photo of
  their most-recently-observed descendant record (which used to change and re-fetch whenever new
  records arrived). Ancestor photos are harvested for free from the `ancestors` array the warm-up
  `/v1/taxa` call already returns, into `app.taxonRankPhoto` keyed `"rank|lowername"` (mirrors
  `app.taxonCommon`), persisted in the durable photo bucket so tiles resolve offline. The group
  representative row is now the smallest observation id (stable), not the most-recent record.
  Helper: `guideTilePhoto(row, rankIdx)`.
- **Integrity pass — accessibility + offline** (2026-07-10). Record cards and Field Guide tiles
  made keyboard-operable (`role="button"` + `tabindex="0"` + Enter/Space); the record modal got
  dialog semantics + a Tab focus-trap + focus-return to the opener; removed a blocking
  `window.prompt` clipboard fallback (callers already show the text inline); the service worker
  now serves the HTML shell **network-first**, so "loads offline once visited" is finally true.
- **Common (vernacular) names.** Rank-appropriate iNat `preferred_common_name`, Australian
  English (`locale=en&preferred_place_id=6744`), in Records, Field Guide, and the Taxa tree —
  keyed `"rank|lowername"` in `app.taxonCommon`, harvested with the photo warm-up, with a baked
  `TAXON_COMMON_SEED` (regenerate via `tools/build-common-seed.mjs`) for instant/offline coverage
  and a climb-up fallback to the nearest ancestor **up to Order** everywhere except the Taxa tree.
- **Scope-aware API top-up.** Top-up replays the CSV's original iNaturalist filter (captured as
  `app.apiQuery`) so it doesn't pull records the export's filter would have excluded. The first
  fetch on a dataset opens a "Top-up scope" gate; pasting the iNat Export **Query** string fills
  it exactly. "Uploaded since" owns the cutoff (clear it to backfill older in-scope records).
  *(This interface is a flagged simplification target — see `docs/NEXT-SESSION.md`.)*
- **Earlier, all shipped** (see git): incremental API import + stale-filter / map-box-clear
  fixes; upper-taxon-rank population for API imports; Snapshot tallies as navigation + Browse-by
  under an active filter; map publication export (two modes); the first Field Guide → iNat
  representative-photo switch + durable photo cache; sidebar reorg → cool-neutral "gallery"
  redesign → Literata serif wordmark; Lightroom-engine removal + header slim + mobile drawer fix;
  the 10-rank taxonomy backbone + navigation set; the Phase 1 Gallery identity.

## Standing decisions (don't re-litigate)

- **Field Guide images:** iNaturalist's own `default_photo` per taxon, rank-appropriate (a family
  tile shows the family's own photo, not a descendant's), offline-cached and stable across new
  records; honest placeholder when none exists.
- **Common names:** iNat only, verbatim, Australian English; climb to the nearest ancestor up to
  Order; the Taxa tree shows own names only; a blank beats a mislabel.
- **Tab label** stays **"Field Guide"**.
- **Add records is a modal front door** (`#addModal` + the header "Add records…" button) with
  **two source tabs**: **From a file** (Replace *or* Add-to-current) and **From iNaturalist** (the
  scope sentence + Preview count + Sync records + Adjust scope / More options). **Update taxa** is a
  quiet maintenance footer. The sidebar holds only lenses; don't put the ingest controls back there.
  **Don't reintroduce the `#scopeModal` modal-over-modal** (scope is inline) nor the tabs-into-stacked
  sections layout.
- **One smart Sync button, no fetch-mode toggle** (`#fetchApi`): it picks the full-import path when
  there's no baseline **or** "Uploaded since" is cleared (backfill, big cap), else an incremental
  top-up. **Don't reintroduce a separate "Full re-import" button** — both paths merge/dedupe, neither
  replaces, so one button covers it.
- **The scope always describes the loaded data.** Both replace *and* append null `app.apiQuery` and
  re-derive; a captured Export Query only overrides when pasted in this session. Don't let a stale
  `app.apiQuery` outlive the dataset it came from (that was the "strange sentence" bug).
- **Add-records panels stay lean.** No Taxa helper prose (the ticks + present-✓ are self-evident);
  **no "Exclude taxon IDs" field** and **no "Observed to" field** (kept "Observed since"). Their
  values (`without_taxon_id`, `d2`) still round-trip from a pasted Export Query via `scopeWorking`
  and surface in the scope sentence — don't re-add the fields.
- **Top-up geography is ON by default** — a padded box round the loaded data, editable/visible,
  with escapes to a place id or Anywhere. This deliberately **reverses** the earlier "bbox opt-in,
  off by default" decision (Lily's call: a travelling observer dragging in out-of-area records is
  the worse failure; over-wide is mitigated by padding + visibility, not by defaulting to Anywhere).
- **The top-up boundary is upload date** (`created_d1`), never observed date, so a months-late
  upload of an old in-scope observation still comes in. "Uploaded since" owns it; **Clear** =
  backfill. Don't default an observed-date window that would suppress late uploads.
- **No accent colour in the chrome** — the interface stays **ink / white / grey** (the Gallery
  system); content and type are the design, photographs are the only colour. Primary action is the
  established filled-ink `.btn-primary`; form controls use `accent-color: var(--ink)` so radios and
  checkboxes tick **ink, not browser-blue**. *(A Fern-green primary was trialled 2026-07-10 and
  **rejected** by Lily — no green, no blue. Don't reintroduce a brand accent colour.)*
- **Publication export** has two modes: a real-basemap screenshot (CORS-safe basemaps only) and a
  clean vector plot (no basemap tiles, always light palette).
- The removed features stay removed: the chip-bar "Clear all" / `clearAllFilters()`, the
  Lightroom title/caption/keyword dropdowns, GBIF common-name enrichment, the `#apiMode` Top-up/Full
  dropdown + the `#scopeModal` scope gate (folded inline), the **"Full re-import" button**, the
  **"Exclude taxon IDs"** and **"Observed to"** fields, and the old **"Test"** API button.
- See `docs/NEXT-SESSION.md` → "Settled decisions" for the fuller list and the working backlog.

## Next up

The **Add records streamline** (tabs, scope sentence, one smart Sync button, leaner panels) is
**merged to `main` and live**. Still worth a live pass with the **real** export against the live iNat
API: confirm a real Sync honours the box + upload boundary end-to-end, and that a cleared-boundary
backfill runs the big-cap full path as intended (Preview count + append were driven live, a full
fetch was not). After that, back-burnered: **Phase 2(c) clustering + spiderfy** and **Phase 3 species
deep-dive**. See `docs/NEXT-SESSION.md` and `docs/ROADMAP.md`.
