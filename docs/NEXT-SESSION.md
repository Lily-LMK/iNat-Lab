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

### 2 · Offline image caching isn't covering enough species for the Field Guide offline

**This one needs a decision from Lily before coding — see the open question below.**

There's already a warm-up mechanism (`scheduleWarmUp()`, `index.html:2655-2726`, called after CSV
load / API top-up / taxon sync at `index.html:6458,6594,6688`): it dedupes `app.rows` by
scientific name, takes one representative photo URL per unique taxon (`r._img`), caps at
`WARM_CAP = 5000`, and background-fetches whatever isn't already in `caches` so the service worker
(`sw.js`) picks it up. So the "one photo per species, up to 5,000" idea is already built — Lily's
report that offline coverage is thin points to it being undermined, not missing entirely. Two
concrete causes found reading `sw.js`:

- **Shared eviction with map tiles.** Species photos and basemap tiles (OSM/OpenTopoMap/ArcGIS/GA
  geology — `sw.js:44-53`) land in the *same* bucket, `CACHE_IMG` (`sw.js:20`), with a single flat
  `IMG_MAX_ENTRIES = 5000` FIFO trim (`sw.js:180-188`, oldest-inserted evicted first, regardless
  of type). Panning/zooming the map during a session can fetch thousands of small tile requests
  that get inserted *after* the warm-up's species photos — and FIFO trim doesn't distinguish them,
  so heavy map use can quietly evict already-warmed species photos. **This is the prime suspect.**
- **24h TTL forces a revalidation attempt**, not a hard delete — `cacheFirstTTL`
  (`sw.js:118-145`) still serves the stale cached copy if a revalidation fetch throws (i.e.
  offline), so this alone shouldn't break true offline use. Worth confirming in testing, but the
  FIFO-eviction issue above is the more likely culprit.

**Recommended fix:** give species photos their own durable cache bucket in `sw.js`, e.g.
`CACHE_TAXON_PHOTOS`, sized independently (~5,500–6,000 entries) and **never sharing eviction with
map tiles or API responses**. `scheduleWarmUp()` writes into it explicitly instead of relying on
the generic `IMG_PATTERNS` route.

**Open question for Lily — "identifiable and reusable... even when there's overlap of species"
across datasets:** today's representative photo for a species is *whichever row happens to be
first* in the currently loaded CSV/rows for that scientific name — i.e. it's really "a photo of an
observation of species X," not "the photo for species X." Loading a different export (a new year,
someone else's data) where the first-seen observation of an overlapping species is a *different*
photo won't reuse anything cached today, even though it's the same species — because nothing is
keyed by species identity, only by URL. Every row already carries a stable `_taxonId`
(`index.html:2601,2631` on import; already used for iNat taxon-lineage sync,
`index.html:5812-5857`), so keying the durable cache by `_taxonId` (falling back to `_sci` for
older CSVs without a taxon_id column) instead of by URL would make it genuinely reusable across
datasets. **The catch:** this means the Field Guide could show a photo from a *different*
observation than the one currently loaded when serving a taxon from the durable offline cache —
a deliberate, scoped exception to the settled "each record's own photo only, no cascade" rule
(see Settled decisions below), limited strictly to the offline/durable-cache fallback path — the
live/online render would still always prefer the current dataset's own `_img`. **Decide with Lily
before implementing:** is that exception acceptable, scoped that narrowly? (Recommended: yes —
online behaviour is unchanged; it only helps when offline and only for taxa without a fresher
photo available.)

- **Verify (once implemented):** load a CSV, let warm-up finish, go offline (devtools "Offline" +
  disable the SW's network passthrough or airplane mode), browse the Field Guide across several
  ranks — tiles for warmed taxa show images, not placeholders; browsing the Map heavily afterward
  doesn't evict them; loading a second, overlapping dataset doesn't re-download species already
  secured.

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
- Tile images use **each record's own photo only** (no multi-source cascade); honest placeholder
  when a taxon has no photographed record.
- Observer palette is the **12-hue theme-aware calm set** (`USER_PALETTE_LIGHT`/`_DARK`), all
  ≥5:1 on their own surface; observer marker is an **inline SVG crosshair** (⌖).
- **No GBIF** anywhere — not the UI, not the SW, not future phases, unless explicitly reintroduced.
- Publication map export = **clean vector / high-DPI, no basemap tiles**.
- Lily's own iNaturalist username may appear as a **placeholder example** — her observations are
  public and meant to be shared. Don't re-flag it.
