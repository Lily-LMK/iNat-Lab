# iNat Lab — Next session

The immediate-actions companion to `ROADMAP.md` (full phase plan) and `../CLAUDE.md`
(orientation). Keep this lean: what to do next, the near-term backlog, the planning queue, and
the settled decisions a fresh session shouldn't re-litigate. **Detailed history lives in git** —
don't turn this into a changelog.

_Last refreshed 2026-07-10. Just shipped (branch `add-records-streamline`, **merged to `main`**):
the **Add records streamline** — the dialog is now **two source tabs** (From a file / From
iNaturalist), the iNaturalist tab a **plain-English scope sentence** + inline **Preview count** +
**one context-aware Sync button** (full import when empty or boundary-cleared, else top-up; the
separate Full re-import button is gone) + **Adjust scope / More options** disclosures. Also fixed
the "strange sentence" bug (append now nulls a stale `app.apiQuery`), and **trimmed the panels**
(no Taxa prose, no Exclude / Observed-to fields). See `../CLAUDE.md` → "Recent work". **Next up:**
a live real-export Sync pass, then Phase 2(c) clustering or Phase 3 species deep-dive._

---

## Start here next — live real-export Sync pass, then roadmap

House rules apply: single-file `index.html`, **no build**; verify in-browser **light + dark +
mobile (375px)**; console clean; focused commits; **don't push until Lily asks**. (Local test
data: git-ignored `sample-inat.csv`; the real export `observations-755169.csv` is also git-ignored,
with valid taxon ids.)

The streamline is **built, verified, and merged** (tabs, sentence, Preview count, one smart button,
leaner panels — driven live on the real 41,891-row export; append + Preview count hit the live API;
light+dark+mobile good; console clean). **Remaining before closing it out:**

- **Live pass with the real export against the live iNat API** — Preview count + append were driven
  live, but a **full Sync fetch** wasn't. Confirm a real Sync honours the box + upload boundary
  end-to-end, and that a **cleared-boundary** Sync runs the big-cap full-import path as intended.
- Key functions to know: `collectScopeFromModal()` (reads the inline controls; `taxon_id` /
  `without_taxon_id` / `d2` live on `scopeWorking`, paste-only), `syncScopeSummary()` +
  `describeAdvancedScope()` (the scope sentence), `previewCount()` (`#apiTest`), the `#fetchApi`
  handler (smart full-vs-topup routing), `refreshAddScopeFromData()` (fills controls on load /
  append / modal-open), `loadCSVFileAppend()` (dedupe-by-id merge; now nulls `app.apiQuery`).

Then, back-burnered: Phase 2(c) **clustering + spiderfy** and Phase 3 **species deep-dive**.

## Planning queue / back-burnered

- **Phase 2(c) — map clustering + spiderfy.** `Leaflet.markercluster` (CDN, keyless) so
  co-located points cluster and spiderfy on click; cluster icons colour by dominant category,
  respecting the "Colour by" control + `app.mapColorOverrides`. Offline/`sw.js` precache not
  needed (Lily's call). No detail specced — start with a plan. **Back-burnered** behind the Add
  records interface work.

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

- **Add records streamline** — two source **tabs** (File / iNaturalist); iNaturalist tab = scope
  **sentence** + inline **Preview count** + **one smart Sync button** (full when empty/backfill,
  else top-up; Full re-import removed) + Adjust scope / More options. Fixed the stale-scope
  "strange sentence" (append nulls `app.apiQuery`); trimmed panels (no Taxa prose, no Exclude /
  Observed-to). Update taxa → quiet footer.
- **Add records redesign** — inline scope (Observers · Area · Uploaded since + More options),
  geography on by default, CSV append (Replace vs Add-to-current), Uploaded-since Clear; Fern-green
  primary trialled + rejected (chrome stays ink/white/grey).
- **Add records modal** — header **"Add records…"** opens one `#addModal` dialog. Retired the
  sidebar accordion + the mobile header-relocation hack; onboarding routes to it;
  focus-trap/Escape/backdrop a11y; closes on load/import.
- **Add Records collapse fix** — the last sidebar panel sat flush against the sticky sidebar's
  scroll-clip edge and wouldn't toggle; `padding-bottom` + `scroll-padding-bottom` clear it.
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

- **Add records is a modal front door** (`#addModal`), opened from the header **"Add records…"**
  button and the onboarding CTA, with **two source tabs**: **From a file** (Replace *or*
  Add-to-current) and **From iNaturalist** (scope sentence + Preview count + **one smart Sync
  button** + Adjust scope / More options). **Update taxa** is a quiet maintenance footer. The
  sidebar holds only lenses (Filters, Dates, Compare) + the warm-up bar — **don't move the ingest
  controls back into the sidebar**, **don't reintroduce the `#scopeModal`** (scope is inline), and
  **don't re-add** the Full re-import button or the Exclude / Observed-to fields. The scope always
  describes the loaded data (replace + append both null a stale `app.apiQuery`).
- **Top-up geography is ON by default** — a padded box round the loaded data, editable + shown,
  with place-id / Anywhere escapes. This **reverses** the old "bbox opt-in, off by default"
  decision (travelling observers dragging in out-of-area records is the worse failure; over-wide
  is mitigated by padding + visibility). The boundary keys off **upload** date (`created_d1`);
  "Uploaded since" owns it, **Clear = backfill**.
- **CSV append** merges deduped by observation id (`loadCSVFileAppend`, same path as an API
  top-up); `app._csvMode` routes the shared `#csvA` handler. Drag-drop + onboarding = Replace.
- **No accent colour** — chrome stays ink/white/grey. Primary = the filled-ink `.btn-primary`;
  radios/checkboxes use `accent-color: var(--ink)` (ink tick, not browser-blue). A Fern-green
  primary was trialled 2026-07-10 and **rejected** by Lily — no green, no blue; don't reintroduce.
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
