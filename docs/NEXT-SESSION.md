# iNat Lab — Next session

The immediate-actions companion to `ROADMAP.md` (full phase plan) and `../CLAUDE.md`
(orientation + current chapter). Keep this lean: what to do next, the near-term backlog, and
the settled decisions a fresh session shouldn't re-litigate.

_Last refreshed 2026-07-05. Three decided UI changes are fully specced below ("Start here
next") for a **Sonnet** session — Lily is near her weekly Opus limit and will pick these up in a
couple of days. They're mechanical + one decided colour ramp; do them before the Phase 2 work._

---

## Start here next — three decided UI changes (ready for a Sonnet session)

Three small, Lily-approved changes, fully specced so they can be implemented cold. Do these
**before** the Phase 2 work below. House rules apply: single-file `index.html`, **no build**;
branch off `main`; verify in-browser **light + dark + mobile (375px)**; console clean; focused
commits; **don't push until Lily asks**. (Local test data: a git-ignored `sample-inat.csv`.)

### 1 · Field Guide should land on **Kingdom** (not Order)
- `index.html:3297` — `const rankIdx = Number.isFinite(app.guideRank) ? app.guideRank : 3;`
  Change the fallback **`3` → `0`** (Kingdom = rank index 0; Order = 3). `app.guideRank` starts
  `null` (`~2480`), so the fallback is what runs on a fresh Field-Guide visit.
- **Verify:** opening the Field Guide with no prior drill lands on the **Kingdom** level with the
  Kingdom "browse by" pill active and kingdom tiles shown. Grep for any other hard-coded Order
  default so nothing re-forces it.

### 2 · Move **"Load new…"** out of the drawer-top into the **Add Records** panel (mobile)
- `syncHeaderLayout()` (`index.html:6960`) currently appends `.headerMeta` (the `#loadCsvBtn`
  "Load new…" button) to `#drawerActions` at the **top of the mobile drawer** — above Snapshot.
  Lily wants it **nested inside the Add Records section** instead.
- **Do:** in the mobile branch of `syncHeaderLayout()`, relocate `.headerMeta` into the **Add
  Records** panel body instead of `#drawerActions`. Add a stable id to the Add Records
  `<details>` accBody/`.stack` (e.g. `#addRecordsBody`) and append there; put it at the **top** of
  that panel's body. Desktop branch unchanged (button returns to the header via
  `insertBefore(_headerMeta, _themeBtn)`). Move the node (don't clone) so its listener is kept, as
  the existing comment notes. Ensure the now-unused `.drawer-actions` container leaves no visual
  gap on mobile.
- **Verify:** on a phone, the open drawer shows **Snapshot first**; "Load new…" appears **inside
  Add Records** and still opens the file picker; on desktop it's still top-right in the header.

### 3 · Redesign the **Dates heatmap** colour ramp → **Viridis** (decided)
The calendar heatmap `heatColor(c)` (`index.html:5057`) is a **monochrome warm-grey ramp** using
stale pre-cool-palette hexes — it reads as muddy brown and doesn't reward busy days. Replace it
with a **perceptually-uniform, colour-blind-safe Viridis-style sequential scale.**

**Design intent:** most days are empty/quiet, so **empty + low buckets stay faint** (they must not
shout); the count buckets then climb a **truncated viridis (teal → green → gold)** so busier days
are brighter/hotter and the busiest **glow**. Deliberately skip viridis's dark-purple low end
(it would make quiet days visually loud).

Keep the existing count thresholds. Recommended stops — **verify in the browser and nudge any
step that's low-contrast on its background** (esp. the dark-theme low steps and the gold ≥100 on
white):

| bucket | light | dark |
|---|---|---|
| empty (c ≤ 0) | `#EAEDF0` | `#1F2329` |
| 1–20   | `#2A788E` | `#2A788E` |
| 21–50  | `#22A884` | `#22A884` |
| 51–74  | `#44BF70` | `#44BF70` |
| 75–99  | `#7AD151` | `#7AD151` |
| ≥ 100  | `#FDE725` | `#FDE725` |

Also in `renderDates` (`~5177–5178`): the **out-of-year** fill is stale warm cream `#F0EEE7` —
change to a faint cool neutral (light `#EEF0F2`, dark `#1B1C1F`, matched to the empty tile). The
**≥100 border** `rgba(26,26,23,.35)` is warm ink — make it theme-aware/subtle (light
`rgba(24,25,27,.30)`, dark `rgba(240,241,242,.35)`), or drop it (the gold tile already reads).
(`heatColor` already branches on `document.documentElement.dataset.theme === "dark"`.)

- **Verify:** the year grid reads as a clean viridis heatmap in **both themes** — quiet days
  faint, busy days climbing teal→green→gold, busiest glowing; **no brown left**; the day tooltip
  and day-click → filter-Records still work.

_Viridis reference samples used: 0.4 `#2a788e`, 0.6 `#22a884`, ~0.7 `#44bf70`, 0.8 `#7ad151`,
1.0 `#fde725`._

## After the three changes — Phase 2, Step 1: curated palette + custom colours

The map already colours + legends by taxonomic rank. Step 1 of the remaining Phase 2 work:

- Replace the hash→HSL colour generator (`markerColor`, ~line 4177 in `index.html`) with a
  **designed, colour-blind-safe categorical palette**, assigned **stably by frequency** (most
  common taxon → first swatch), cycling when categories exceed the palette.
- Store overrides in an `app.mapColorOverrides` map keyed by `colorBy` + category; `markerColor`
  checks the override first, then the palette slot.
- Make the **legend swatches editable** (`buildLegend`, ~4881): click a dot → native colour
  picker → markers + legend recolour live; a "reset colours" affordance. This is where Lily's
  per-taxon colour choices live (needed for publication figures).

Then Step 2 (clustering + spiderfy, `Leaflet.markercluster`) and Step 3 (clean vector /
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
