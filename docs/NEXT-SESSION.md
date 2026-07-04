# iNat Lab — Next session

The immediate-actions companion to `ROADMAP.md` (full phase plan) and `../CLAUDE.md`
(orientation + current chapter). Keep this lean: what to do next, the near-term backlog, and
the settled decisions a fresh session shouldn't re-litigate.

_Last refreshed 2026-07-05._

---

## Start here next — Phase 2, Step 1: curated palette + custom colours

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

## Requested UI changes (Lily, 2026-07-05)

1. **Remove the "Clear all" filter button entirely — never show it.** The chip-bar "Clear all"
   (`index.html:3063–3065`, in the filter-chip renderer) wastes real estate, especially on the
   phone, and is redundant: x-ing out a parent taxon level already cascades and clears its
   downstream ranks. Remove the button; `clearAllFilters()` (`~6819`) then has no caller, so
   remove it too (confirm no other use first). Keep per-chip ✕ removal.

2. **Make the Field Guide focus-header buttons uniform and intentionally designed.** The three
   actions — **Records view** (`#guideToRecords`), **{Rank} index** (`#guideBackIndex`), and
   **View on iNaturalist** (`#guideInatLink`) at `index.html:3406–3409` — look mismatched,
   worst on iPhone. Causes: `#guideInatLink` is an `<a class="smallBtn">` while the others are
   `<button>`s, and `.smallBtn` (`~1104`) sets no `color`, so the anchor inherits default
   **link-blue**; and `#guideBackIndex` is prefixed with a `↩` glyph that renders **emoji-style**
   on iOS. Fix: one consistent treatment (equal height/padding, explicit `color:var(--ink)`, no
   underline), drop the `↩` emoji (clean inline SVG chevron or nothing), so the group reads as a
   deliberate, graphic-designer-quality control cluster on desktop and phone. Keep the 44px
   mobile touch target (`.guideActions .smallBtn`, `~1153`).

3. **Record-detail modal taxa-tree links should filter Records, not hop to Field Guide.** In the
   record modal, the Taxonomy breadcrumb (`taxonomyBreadcrumbLinks`, rendered `~5515`; click
   handler `~5529–5544`) calls `applyLineageKey(pk, "guide")` — jumping to the Field Guide. The
   record **card** trail links (`~3853–3861`) call `applyLineageKey(pk, "records")` — staying and
   filtering records at that rank. Make the modal match the card: change the modal handler to
   `applyLineageKey(pk, "records")` + `closeModal()`, so clicking a rank shows other records at
   that rank. (Related: the map-popup breadcrumb at `~4855` also uses `"guide"` — confirm with
   Lily whether it should change too.)

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

- Tab label stays **"Field Guide"** (Lily's call).
- Tile images use **each record's own photo only** (no multi-source cascade); honest placeholder
  when a taxon has no photographed record.
- Observer palette is the **12-hue theme-aware calm set** (`USER_PALETTE_LIGHT`/`_DARK`), all
  ≥5:1 on their own surface; observer marker is an **inline SVG crosshair** (⌖).
- **No GBIF** anywhere — not the UI, not the SW, not future phases, unless explicitly reintroduced.
- Publication map export = **clean vector / high-DPI, no basemap tiles**.
- Lily's own iNaturalist username may appear as a **placeholder example** — her observations are
  public and meant to be shared. Don't re-flag it.
