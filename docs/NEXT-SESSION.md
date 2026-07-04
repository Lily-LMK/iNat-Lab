# iNat Lab — Next session plan

Written 2026-07-04, updated end of session (all shipped items on `main` + **pushed**).

**This session completed:** service worker + offline cache warm-up (§7), and full GBIF removal.
Both merged to `main` and live on GitHub Pages.

---

## Status summary

| Item | Status |
|---|---|
| Responsive 680px single-swap | ✅ DONE |
| Single scroll container (trackpad bounce fix) | ✅ DONE — real-trackpad sign-off confirmed 2026-07-04 |
| UI cleanups (chip wrap, guide header, Taxa) | ✅ DONE |
| Taxa tree redesign (§2) | ✅ DONE |
| Service worker / offline (§7) | ✅ DONE |
| GBIF removal | ✅ DONE — zero references remain |
| Visual polish (§3) | Open |
| Phase 2: Map by taxonomic rank | Open |
| Phase 3: Species deep-dive panel | Open |
| Phase 4: Spatial context layers | Open |
| Phase 5: Publish polish + shareable URL state | Open |

---

## 1. ✅ Real-trackpad sign-off — CONFIRMED 2026-07-04

The single-scroll refactor (`c2d7e75`) is confirmed fixed on Lily's MacBook Pro trackpad.

---

## 2. ✅ Service worker / offline + import warm-up — DONE

**What shipped:**

- **`sw.js`** (new file, 189 lines). Three caches:
  - `inatlab-static-v1` — cache-first, indefinite: Leaflet, esri-leaflet, Inter font CDN
  - `inatlab-api-v1` — stale-while-revalidate, 1h: iNat API, Wikipedia API
  - `inatlab-img-v2` — cache-first, 24h TTL, 5,000-entry LRU: iNat photos (static + S3), Wikimedia, OSM/Esri/OpenTopo/GA tiles
  - Real failures propagate; no synthetic responses.
- **Registration** in `index.html` at boot, silent-fail if not `https`/`localhost`.
- **Eager warm-up on import** (CSV load, full API import, top-up):
  - Deduplicates to **one representative photo per unique taxon** (`_sci` key) — the same image the Field Guide tile shows. Scales with distinct taxa (~2–4k for a 50k record set), not observation count.
  - Already-cached URLs skipped (fast cache-check loop before fetching).
  - Cap 5,000 (comfortably above any personal species list); 4 concurrent workers; `requestIdleCallback` yield between fetches.
  - Progress bar in sidebar: "Preparing N taxa for offline… X%" with a × cancel button. Auto-hides when done.
- **Cache strategy for switching datasets:** cache is cumulative — loading a new CSV layers on top. Field Guide images for the old dataset survive as long as the combined unique-taxon count stays under 5,000. Reload the original CSV and Field Guide serves from cache immediately.

**To verify in a real browser:**
- DevTools → Application → Service Workers → confirm `sw.js` registered and active.
- Load your 50k CSV → warm bar appears in sidebar and counts up.
- Toggle DevTools network offline → Field Guide tiles still load from cache.

---

## 3. ✅ GBIF removal — DONE

All GBIF code removed in one pass (-1,372 lines). Zero references remain in `index.html` and `sw.js`. Removed:
- GBIF common-name enrichment modal and button
- GBIF taxa explorer panel (from Taxa view)
- GBIF density tile overlay and occurrence points layer (from Map)
- All GBIF API calls, caches, localStorage keys, app state (`gbifExplorer`, `mapState.gbif*`)
- GBIF patterns from the service worker

The Taxa tree "Guide" button and map remain fully functional without GBIF.

---

## 4. Visual polish — next priority

Independent, do in any order once behaviour is solid:

- **Research-grade underline.** The `.rg` card bottom-border — revisit weight/colour/placement so it reads as an intentional "research grade" cue in both themes.
- **Name / date typography hierarchy.** Scientific name vs common name vs date — size, weight, italics, spacing. Make scientific name the clear anchor.
- **Tile spacing.** Grid gaps, card padding, thumb-to-text rhythm; consistency between Records and Field Guide tiles.
- **Image framing.** How photos sit in the thumb (`object-fit`, aspect-ratio, radius, inset) and how the placeholder matches.
- **Resize-transition flash** (optional). Dragging the window across 680px briefly animates the drawer transform. Fix: only transition `transform` when drawer opens/closes, not on mode flip.

---

## 5. Phase 2 — Map by taxonomic rank

Add a "Colour by" control on the Map panel: User (current) | Order | Family | Genus.
- Stable per-rank colour scale keyed to values in the current filtered set.
- Legend with counts; click entry to filter/highlight.
- Keep A/B comparison mode as one option.
- Honest labelling of records with no coordinate.

---

## 6. Phase 3 — Species deep-dive panel

A focused single-species view triggered from any species tile/card.
- Wikipedia description (link + attribution), rank-appropriate common name(s), representative image, key stats (count, date range, top places), external links (iNat).
- Accessible modal/drawer (focus trap, escape, reduced-motion).
- Cache; lazy-load; provenance on every field.

---

## 7. Phase 4 — Spatial context layers

Toggleable overlays on the map: IBRA/IMCRA bioregions, LGAs, geology, elevation.
- Click-to-identify where the service supports it; show region name + source.
- Layer control that works on mobile; sensible defaults (off until asked).
- Honest failure states when a service is blocked/offline.

---

## 8. Phase 5 — Publish polish, a11y, shareable URL state

- Shareable URL state (encode active filters/view).
- WCAG 2.1 AA pass across all UI.
- Real-device mobile check.
- License + attribution in README and in-UI.
- Final GitHub Pages deploy smoke-test.

---

## Not in scope / already settled

- Image tiles use **our own record photos only** (no multi-source cascade).
- Observer palette is the **12-hue theme-aware calm set**; marker is the **inline SVG crosshair**.
- Tab label stays **"Field Guide"** — Lily's call.
- **No GBIF** anywhere — not in the UI, not in the SW, not in future phases unless explicitly re-introduced.
- Records card §4 is **done**. All HANDOFF items are now done.
