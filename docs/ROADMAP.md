# iNat Lab — Roadmap

The phased plan for iNat Lab: a publicly shareable, single-file iNaturalist explorer with a
distinctive visual identity and three capabilities ported from the sibling project QM Explorer.
This file is the **sequencing**; `../CLAUDE.md` holds the orientation + current chapter, and
`NEXT-SESSION.md` the immediate next actions + backlog.

Guiding decisions (agreed with Lily):

- **Port three QM Explorer capabilities:** map-by-taxonomic-rank, species deep-dive panel,
  spatial context layers.
- **Distinctive visual identity** — shipped as **"Gallery"** (light-default, editorial,
  one typeface Inter, hairline/monochrome UI, opt-in dark). Not a reskin of the old warm-paper
  theme.
- **Public-shareable** — privacy care, onboarding, shareable URL state, honest empty states.
- **Single-file, no-build, keyless, static → GitHub Pages. Mobile-flawless.**

Work in **small, verifiable slices**; keep `main` deployable; the five views (Records, Taxa,
Field Guide, Dates, Map) and the ingest/metadata engine keep working throughout.

> **Status:** Phases **0, 1 complete** and live on GitHub Pages
> (https://lily-lmk.github.io/iNat-Lab/). **Phase 2 (a) and (b) are shipped** (curated/custom
> palette; publication export — screenshot + vector modes); **(c) clustering + spiderfy**
> remains, back-burnered. The app has since had a sidebar/header cleanup and a full 10-rank
> taxonomy backbone — see `../CLAUDE.md` "Current chapter".

---

## Phase 0 — Foundation & safety net ✅ DONE

- [x] `git init` + baseline commit; `.gitignore`, `CLAUDE.md`, `README.md`.
- [x] GitHub repo (`Lily-LMK/iNat-Lab`) + **GitHub Pages** live from `main`.
- [x] Non-personal sample CSV for local testing (`sample-inat.csv`, git-ignored).
- [x] Audit: no hardcoded personal defaults (username field is placeholder-only).

## Phase 1 — Design system & shell ✅ DONE ("Gallery" identity)

- [x] Design language as CSS custom properties (light `:root` + `[data-theme="dark"]`).
- [x] App shell: ink-on-paper masthead, underline text-nav tabs, hairline cards; mobile
      off-canvas drawer.
- [x] Core components restyled (buttons, selects, inputs, chips, cards, modals, tabs).
- [x] Motion vocabulary + `prefers-reduced-motion` guard.
- [x] Onboarding / empty state (wordmark + "Load CSV" / "Pull from iNaturalist" CTAs).
- [x] Service worker (`sw.js`) — app-shell + media caching, with per-taxon warm-up on import.

## Phase 2 — Map by taxonomic rank 🟡 (a) + (b) DONE, (c) remaining

Built: a **"Colour by"** control (User | Order | Family | Superfamily | Subfamily | Tribe |
Genus | Species), deterministic per-category colours with rank fallback, and a collapsible
**legend** with counts.

- [x] **(a) Curated palette + custom colours.** ✅ Shipped. Designed colour-blind-safe 8-hue
      categorical scale, assigned stably by frequency; editable legend swatches (click → colour
      picker) writing `app.mapColorOverrides`, with per-mode reset.
- [x] **(b) Publication export.** ✅ Shipped (commit `3e7297a`). An **"Export map"** button +
      popover, with **two modes**: a **map screenshot** (the actual rendered basemap tiles +
      points + legend, PNG, via canvas — restricted to CORS-friendly basemaps: Satellite/Esri
      Topo/Geology) and a **clean vector plot** (SVG + high-DPI PNG, no basemap tiles, always
      light-palette). The written brief specced only the vector figure; Lily asked to see the
      real map after reviewing the bare-dots result, so the screenshot mode was added alongside
      it rather than replacing it. Both honestly report omitted no-coordinate records and reuse
      `markerColor`/`categoryKeyFor`/`_catRank` so exported colours (incl. custom overrides)
      match the on-screen map exactly.
- [ ] **(c) Clustering + spiderfy.** ← **next.** Add `Leaflet.markercluster` (CDN) so co-located
      iNat points cluster and spiderfy on click; cluster icons colour by the dominant category.
      **Back-burnered** and **offline not required** — skip any `sw.js` precache work for this
      (Lily doesn't need the map offline for now).

Not prioritised: click-a-legend-entry-to-filter (colour-editing already lives in the legend).

## Phase 3 — Species deep-dive panel

Goal: a focused, provenanced single-species view.

- [ ] Trigger from any species (Records tile, Taxa leaf, Field Guide tile, map point).
- [ ] Content: **Wikipedia** description (link + attribution), **rank-appropriate common
      name(s)**, representative **image** (the species' own record photo), key stats from the
      loaded set (count, date range, top places, observers), and **external links** (iNat).
- [ ] Reuse iNat/Wikipedia resolvers; cache; lazy-load; show provenance on every field.
- [ ] Accessible modal/drawer (focus trap, escape, reduced-motion).

## Phase 4 — Spatial context layers

Goal: "where does this record sit" context on the map.

- [ ] Toggleable overlays: **IBRA/IMCRA bioregions**, **LGAs**, **geology**, **elevation**
      (start with whichever public services are reliable and CORS-friendly; esri-leaflet is
      already loaded).
- [ ] Click-to-identify where supported; show region name + source (geology identify already
      works — use it as the pattern).
- [ ] Layer control that works on mobile; overlays off by default.
- [ ] Honest failure states when a service is blocked/offline.

## Phase 5 — Public-app polish, a11y, mobile, publish

- [ ] **Shareable URL state** — encode active view + filters so a link reproduces a lens.
- [ ] **Accessibility pass** — WCAG 2.1 AA across all UI (contrast, keyboard, focus, labels,
      modal traps, reduced-motion).
- [ ] **Mobile pass** — real-device check: layout, map, modals, filter drawer, no overflow.
- [ ] **Performance** — lazy-load, throttle, virtualise large lists/ranks if needed.
- [ ] **License + attribution** finalised in README and in-UI.
- [ ] Final Pages smoke-test on desktop + phone.

---

## Sequencing notes

- Phases 3–4 are independent enough to reorder.
- Keep each phase on its own branch; deploy to `main` per verified slice.
- After each phase, update `../CLAUDE.md`'s "Current chapter" so a fresh session re-enters cleanly.
