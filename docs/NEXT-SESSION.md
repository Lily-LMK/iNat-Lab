# iNat Lab — Next session plan

Written 2026-07-04, updated end of session (all shipped items on `main` + **pushed**).

**This session completed:** single-scroll container refactor (eliminates trackpad bounce bug class),
UI cleanups §4 (chip wrap, guide focus header, section heading), and the full Taxa tree redesign.
All three merged to `main` and live on GitHub Pages.

---

## Status summary

| Item | Status |
|---|---|
| Responsive 680px single-swap | ✅ DONE |
| Single scroll container (trackpad bounce fix) | ✅ DONE — **real-trackpad sign-off pending** |
| UI cleanups (chip wrap, guide header, Taxa) | ✅ DONE |
| Taxa tree redesign (§2) | ✅ DONE |
| Visual polish (§3) | Open |
| Service worker / offline (§7) | Open |
| Phase 2: Map by taxonomic rank | Open |
| Phase 3: Species deep-dive panel | Open |
| Phase 4: Spatial context layers | Open |
| Phase 5: Publish polish + shareable URL state | Open |

---

## 1. ✅ Real-trackpad sign-off — **CONFIRMED 2026-07-04**

The single-scroll refactor (`c2d7e75`) is confirmed fixed on Lily's MacBook Pro trackpad. The Field
Guide "one of each species" plate no longer snaps to the top during wheel/gesture scroll.

---

## 2. Service worker / offline + import warm-up (§7) — **START HERE**

Not started. Port from QM Explorer's `sw.js` + add eager warm-up on CSV import.

**Scope (agreed with Lily — see `HANDOFF.md §7`):**
- **SW static cache (cache-first, versioned):** Leaflet/esri-leaflet unpkg, Inter font CDN.
- **SW API cache (stale-while-revalidate, ~1h):** `api.inaturalist.org/v1/*`, `api.gbif.org/v1/*`,
  Wikipedia API.
- **SW image cache (cache-first, ~24h, LRU):** iNat observation photos, Wikimedia uploads, map tiles.
- **Eager warm-up on import:** after CSV load/API top-up, background-queue pre-fetches for unique
  taxa (one representative photo + vernacular per taxon); bounded concurrency (~4–6 in flight);
  `requestIdleCallback`; progress indicator; cancellable; skip already-cached.
- **Note:** needs `https` or `localhost` — works on GitHub Pages + local server, not `file://`.

---

## 3. Visual polish (after trackpad sign-off)

Independent, lower-priority — do in any order once behaviour is solid:

- **Research-grade underline.** The `.rg` card bottom-border — revisit weight/colour/placement so it
  reads as an intentional "research grade" cue in both themes.
- **Name / date typography hierarchy.** Scientific name vs common name vs date — size, weight, italics,
  spacing. Make scientific name the clear anchor.
- **Tile spacing.** Grid gaps, card padding, thumb-to-text rhythm; consistency between Records and
  Field Guide tiles.
- **Image framing.** How photos sit in the thumb (`object-fit`, aspect-ratio, radius, inset) and how
  the placeholder matches.
- **Resize-transition flash** (optional). Dragging the window across 680px briefly animates the drawer
  transform. Fix: only transition `transform` when drawer opens/closes, not on mode flip. Gate
  transitions behind a `.ready` class added post-boot.

---

## 4. Phase 2 — Map by taxonomic rank

QM Explorer's `renderMap` colours points by a chosen rank (Order / Family / Genus / User) with a
stable colour scale and a click-to-filter legend.

**For iNat Lab:**
- Add a "Colour by" control on the Map panel: User (current) | Order | Family | Genus (+ chosen rank).
- Build a stable per-rank colour scale keyed to the rank's values in the current filtered set.
- Legend with counts; click entry to filter/highlight.
- Keep A/B comparison mode as one option.
- Honest labelling of records with no coordinate.

---

## 5. Phase 3 — Species deep-dive panel

A focused single-species view triggered from any species tile/card.

- **Content:** Wikipedia description (link + attribution), rank-appropriate common name(s),
  representative image, key stats (count, date range, top places, observers), external links
  (iNat / GBIF).
- Accessible modal/drawer (focus trap, escape, reduced-motion).
- Reuse existing iNat/GBIF/Wikipedia resolvers; cache; lazy-load; provenance on every field.

---

## 6. Phase 4 — Spatial context layers

Toggleable overlays on the map: IBRA/IMCRA bioregions, LGAs, geology, elevation.
- Click-to-identify where the service supports it; show region name + source.
- Layer control that works on mobile; sensible defaults (off until asked).
- Honest failure states when a service is blocked/offline.

---

## 7. Phase 5 — Publish polish, a11y, shareable URL state

- Shareable URL state (encode active filters/view).
- WCAG 2.1 AA pass across all UI.
- Real-device mobile check.
- License + attribution in README and in-UI.
- Final GitHub Pages deploy smoke-test.

---

## Not in scope / already settled

- Image tiles use **our own record photos only** (no multi-source cascade).
- Observer palette is the **12-hue theme-aware calm set** (`USER_PALETTE_LIGHT/_DARK`); marker is
  the **inline SVG crosshair**. Don't reintroduce olive at A/B. "No chartreuse — *not just yet*."
- Tab label stays **"Field Guide"** (not renamed to "Browse") — Lily's call for now.
- Records card §4 is **done**. HANDOFF remaining: §7 service worker (§2 Taxa now done too).
