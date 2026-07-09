# iNat Lab — Next session

The immediate-actions companion to `ROADMAP.md` (full phase plan) and `../CLAUDE.md`
(orientation). Keep this lean: what to do next, the near-term backlog, the planning queue, and
the settled decisions a fresh session shouldn't re-litigate. **Detailed history lives in git** —
don't turn this into a changelog.

_Last refreshed 2026-07-10. Recently shipped (on `main`, live): **Field Guide stable per-taxon
photos** (higher-rank tiles show iNaturalist's own `default_photo` for that taxon, harvested per
`"rank|lowername"` and offline-cached, instead of borrowing the most-recent descendant's photo);
an **integrity pass** (keyboard operability for cards/tiles, record-modal focus management,
network-first offline shell, removed a blocking clipboard prompt). Next up: Phase 2(c) clustering
+ spiderfy._

---

## Start here next — Phase 2 (c): clustering + spiderfy

House rules apply: single-file `index.html`, **no build**; branch off `main`; verify in-browser
**light + dark + mobile (375px)**; console clean; focused commits; **don't push until Lily asks**.
(Local test data: a git-ignored `sample-inat.csv`; the real export `observations-755169.csv` is
also git-ignored and has valid taxon ids for photo/common-name checks.)

**Goal:** add `Leaflet.markercluster` (CDN, keyless) so co-located iNat points (identical/near
coordinates are common) cluster and spiderfy on click, keeping dense top-ups readable and fast.
Cluster icons should colour by the dominant category, respecting the "Colour by" control and
`app.mapColorOverrides`. **Offline/`sw.js` precache is not needed for this** (Lily's call — she
doesn't need the map offline). No detail specced yet — start with a plan.

## Planning queue (needs a design session before building)

- **Top-up interface simplification.** The "Top-up scope" flow (scope modal, inferred
  constraints, paste-the-Export-Query, the two date axes with "Uploaded since" / backfill) is
  powerful but heavy — too many concepts for a routine "get my new records" action. Worth a
  dedicated planning session to find the minimal interface that still reproduces the CSV's
  original iNat filter. Likely directions: lead with the common case (top-up by username/project,
  scope inferred silently and shown as a quiet, editable summary) and tuck the full scope editor
  behind an "advanced" affordance; reconsider whether the confirm gate needs to be a modal.
  Don't start building until the simpler model is agreed.

## Loose ends (low priority)

- **Spot-check the top-up breadcrumb path.** The upper-taxon-ranks fix (`53c775b`) was verified
  live against a **full import**; the top-up-into-a-loaded-CSV path runs the same `obsToRowObj`,
  so it's near-certain fine but wasn't driven live. Confirm a real top-up's new records show a
  full Kingdom→Species breadcrumb.
- **Test harness is ephemeral.** Headless-Chrome tests live in the session scratchpad and don't
  persist. Reusable approach (also in `../CLAUDE.md`): Node 24 has a global `WebSocket`, so a
  tiny dependency-free CDP driver works; feed the real CSV via `DOM.setFileInputFiles`; the app
  JS is inside an IIFE so `app`/functions aren't global — drive real UI and assert via the DOM.
  For **data-flow** tests set `Network.setBypassServiceWorker` **and** `setCacheDisabled` (or the
  cached shell is served); for the **offline** test do the opposite (let the SW serve the shell)
  and toggle `Network.emulateNetworkConditions`. Auto-dismiss `Page.javascriptDialogOpening`.

## Visual-polish backlog (independent; do in any order)

- **Field Guide progressive photo fill (targeted DOM patch).** `scheduleWarmUp()` does a single
  `render()` when the whole photo pass finishes (no live update during the loop) — this killed a
  once-a-second flash but tiles stay on their fallback until the pass ends (~3–4 min on a big
  set). For progressive fill **without** the flash: tag each guide thumb with its lookup key,
  then after each batch run a small `patchGuidePhotos()` that swaps only the `src` of the tiles
  whose photo just resolved, leaving other nodes untouched. Keep a final `render()` as a safety
  sweep. Low risk, self-contained; the simple "render once at the end" version shipped first.
- **Research-grade underline.** Revisit the `.rg` card bottom-border weight/colour/placement so
  it reads as an intentional cue in both themes.
- **Name / date typography hierarchy.** Scientific vs common name vs date — make the scientific
  name the clear anchor.
- **Tile spacing & image framing.** Grid gaps, card padding, thumb-to-text rhythm; `object-fit` /
  aspect-ratio / radius on thumbs, and a matching placeholder — consistent across Records and
  Field Guide.
- **Map legend for high-cardinality ranks.** Colour-by-Family renders ~690 legend rows and the
  palette necessarily cycles. Consider a "top-N + Other" grouping so the legend stays legible.
- **Resize-transition flash** (optional). Dragging the window across the drawer breakpoint briefly
  animates the transform; transition only on open/close, not on the mode flip.

## Recently shipped (newest first — one line each; git has the detail)

- **Field Guide stable per-taxon photos** — own `default_photo` per rank (`app.taxonRankPhoto`,
  `"rank|lowername"`, offline-cached), stable representative row (smallest obs id).
- **Integrity pass** — keyboard-operable cards/tiles, record-modal dialog semantics + focus trap
  + focus return, network-first offline app-shell, removed blocking `window.prompt`.
- **Common (vernacular) names** — iNat `preferred_common_name` (AU English) in Records / Field
  Guide / Taxa tree; baked `TAXON_COMMON_SEED`; climb-up to Order (not the Taxa tree).
- **Scope-aware API top-up** — replays the CSV's iNat filter (`app.apiQuery`) via a scope gate;
  paste the Export Query; "Uploaded since" cutoff + backfill.
- **API ingest fixes** — incremental import (render as pages arrive), stale date-filter + map-box
  clears on dataset replace, upper-taxon-rank population, 429 backoff.
- **Snapshot navigation** — Snapshot tallies jump to Records / the Field Guide Browse-by index;
  Browse-by works under an active taxon filter.
- **Map publication export** — two modes: real-basemap screenshot (CORS-safe basemaps) + clean
  vector plot (no tiles, light palette).
- **Field Guide → iNat representative photos** — the first switch to curated `default_photo` +
  the durable taxon-photo cache (`CACHE_TAXON_PHOTOS`).
- **Gallery identity + sidebar** — cool-neutral palette (light/dark), Literata serif wordmark,
  sidebar reorg, mobile drawer fix, Lightroom-engine removal.
- **Taxonomy backbone** — full 10-rank cascade + Taxa tree, chip bar, Records ⇄ Field Guide hop.

## Settled decisions (don't re-litigate)

- Interface palette is a **cool near-neutral "gallery" ramp** (light + dark) — **not** warm cream.
  Photographs are the only colour; chrome stays quiet.
- **Wordmark is a serif (Literata)**, scoped to the masthead lockup + onboarding `.mark` via the
  `--wordmark` token — the one reserved exception to the single-typeface (Inter) system. Use
  `font-optical-sizing:auto` so it stays legible small. (Fraunces was rejected — fragile small.)
- Tab label stays **"Field Guide"**.
- **Field Guide tiles show iNaturalist's own `default_photo` for the taxon at its own rank** —
  rank-appropriate (a phylum tile shows the phylum's photo, not a descendant's), stable across new
  records, offline-cached (`app.taxonRankPhoto`, `"rank|lowername"`, persisted in the durable
  photo bucket). Falls back to the representative record's own photo until warm-up resolves, then
  an honest placeholder. Muted photographer/licence credit on **focus-page tiles only**, and only
  for iNat's own photo. Warm-up is batched (30 IDs/request) + resumable.
- **Records / Map / record-detail modal** use **each record's own photo only** (no cascade);
  honest placeholder when a taxon has no photographed record.
- **Common names** come from iNaturalist only (`preferred_common_name`, **Australian English** via
  `preferred_place_id=6744`), shown **verbatim** — no curated dictionary, no GBIF/ALA/Wikipedia.
  Rank-appropriate and blank-beats-mislabel, **except** the climb-up fallback (unnamed taxa borrow
  the nearest ancestor's name **up to Order**; class/phylum/kingdom are too generic). The **Taxa
  tree shows each node's own name only** (no climb); Records cards, Field Guide tiles, and the
  focus header do climb. The baked seed (`TAXON_COMMON_SEED`) is public taxonomy only — regenerate
  with `tools/build-common-seed.mjs`, not by hand.
- Observer palette is the **12-hue theme-aware calm set** (`USER_PALETTE_LIGHT`/`_DARK`); observer
  marker is an inline SVG crosshair (⌖).
- Publication map export = **two modes**: a real-basemap **screenshot** (CORS-safe basemaps only)
  and a **clean vector plot** (no tiles, always light palette).
- **Accessibility is AA-baseline:** interactive tiles are keyboard-operable, the record modal
  traps focus and restores it, visible focus rings throughout. Don't regress to click-only `<div>`s.
- **No GBIF** anywhere unless explicitly reintroduced. Removed features stay removed (chip-bar
  "Clear all" / `clearAllFilters()`, the Lightroom title/caption/keyword dropdowns).
- Lily's own iNaturalist username may appear as a **placeholder example** — public data, meant to
  be shared. Don't re-flag it.
