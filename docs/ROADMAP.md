# iNat Lab — Roadmap

This is the phased plan for taking iNat Lab from a capable-but-plain single-file tool to an
awwwards-calibre, publicly shareable iNaturalist explorer with four new capabilities ported
from QM Explorer. The creative and functional detail for the redesign lives in
`OPUS-BRIEF.md`; this file is the sequencing.

Guiding decisions (agreed with Lily, 2026-07-03):

- **Port four QM Explorer capabilities:** map-by-taxonomic-rank, species deep-dive panel,
  spatial context layers, image cascade with provenance.
- **Fresh distinctive visual identity** — a new awwwards-calibre look, not a reskin.
- **Public-shareable** — privacy care, onboarding, shareable URL state, honest empty states.
- **Single-file, no-build, keyless, static → GitHub Pages. Mobile-flawless.**

Work in **small, verifiable slices**; keep `main` deployable; the existing five views and the
ingest/metadata engine keep working throughout. Elevate, don't regress.

> **Status (2026-07-03):** **Phase 1 is done and merged to `main`** — but the visual direction
> **pivoted** from the original brief. Lily rejected a first dark attempt as "elementary"; the
> shipped identity is **"Gallery"**: a **light-default, editorial, photographer-portfolio**
> aesthetic (gallery-monochrome, one typeface — Inter, no emoji) with a **dark toggle**. Also
> shipped: **breadcrumbs** + a **"one of each species"** browse. See `../CLAUDE.md` "Current
> chapter".
>
> **The next phase is re-specified in [`HANDOFF.md`](HANDOFF.md)** — Lily's newer requirements
> (Field Guide → **Browse** ported from QM; **Taxa** aligned to QM; **Records⇄Browse** hop;
> **Records card** redesign with a coloured **⌖** observer marker; **search-bar** redesign;
> **service-worker caching/offline**). `HANDOFF.md` supersedes Phases 2–5 below where they
> overlap and cites the exact QM Explorer functions to port.

---

## Phase 0 — Foundation & safety net (do first)

Goal: make the redesign safe to attempt on a 7,800-line single file.

- [ ] `git init`, commit the current app as the **baseline** (so every later step is a
      reversible diff). Add `.gitignore` (done), `CLAUDE.md` (done), `README.md` (done).
- [ ] Create the **GitHub repo** and push baseline. Enable **GitHub Pages** from `main`.
      (Proposed: `lily-lmk/iNat-Lab` → `https://lily-lmk.github.io/iNat-Lab` — confirm name.)
- [ ] Add a tiny **non-personal sample CSV** for local testing (kept local, git-ignored) and
      note how to load it, so any session can verify without Lily's data.
- [ ] Quick **audit pass**: confirm no hardcoded personal defaults (verified: username field
      is placeholder-only); list the JS entry points Opus will touch (`renderMap`,
      `renderGallery`/Records, Taxa tree, Field Guide, the export modal, state object).
- [ ] Add a lightweight **self-test hook** (mirror QM Explorer's `?selftest`) if practical:
      load sample data and assert counts/render, so regressions surface fast.

Exit: baseline is live on Pages, reproducible locally with sample data, nothing personal shipped.

## Phase 1 — Design system & shell (Opus leads)

Goal: establish the fresh identity as reusable tokens + the app shell, before touching features.

- [ ] **Design language:** palette, type scale, spacing, radii, elevation, motion — as CSS
      custom properties (replace the current `:root` warm/green tokens). One source of truth.
- [ ] **App shell:** header, view switcher, sidebar/filters, and the mobile layout (drawer or
      bottom nav). Responsive from 320px up; no horizontal overflow; touch targets ≥ 44px.
- [ ] **Core components restyled** to the new system: buttons, selects, inputs, chips, cards,
      modals, toasts, tabs — without changing their behaviour or IDs where possible.
- [ ] **Motion + reduced-motion**: define the motion vocabulary and honour
      `prefers-reduced-motion` from the start.
- [ ] **Onboarding / empty states:** a first-run state that explains the app and offers
      "Load CSV" / "Pull from iNaturalist" (public-app requirement).

Exit: every existing view renders in the new identity, on desktop and mobile, with real
empty/loading states. No feature lost.

## Phase 2 — Ported capability: Map by taxonomic rank

Goal: colour/cluster the map by taxonomy, not just by user.

- [ ] Add a **"Colour by"** control on the Map: User (current) | Order | Family | Genus |
      (chosen rank). Build a stable colour scale keyed to the rank's values.
- [ ] **Legend** with counts; click a legend entry to filter/highlight that taxon on the map.
- [ ] **Clustering** at low zoom (optional) that respects the rank colouring.
- [ ] Reuse the existing point/marker plumbing; keep A/B user mode available as one option.
- [ ] Honest labelling of records with **no coordinate** (don't silently drop them).

Exit: user can switch the map's colour dimension to any available rank, with a readable
legend, on mobile too.

## Phase 3 — Ported capability: Species deep-dive panel

Goal: a focused, beautiful single-species view.

- [ ] Trigger from any species (Records tile, Taxa leaf, Field Guide, map point).
- [ ] Content: **Wikipedia** description (with link + attribution), **rank-appropriate common
      name(s)**, representative **image** (via the Phase 5 cascade), key stats from the loaded
      set (count, date range, top places, observers), and **external links** (iNat / GBIF).
- [ ] Reuse iNat/GBIF/Wikipedia resolvers; cache; lazy-load; show provenance on every field.
- [ ] Accessible modal/drawer (focus trap, escape, reduced-motion).

Exit: one click from anywhere gives a provenanced, attractive species summary.

## Phase 4 — Ported capability: Spatial context layers

Goal: "where does this record sit" context on the map.

- [ ] Add toggleable overlays: **IBRA/IMCRA bioregions**, **LGAs**, **geology**, **elevation**
      (start with whichever public services are reliable and CORS-friendly).
- [ ] Click-to-identify where the service supports it; show the region name + source.
- [ ] Layer control that works on mobile; sensible defaults (overlays off until asked).
- [ ] Honest failure states when a service is blocked/offline (learn from QM Explorer's
      geology-identify handling).

Exit: user can overlay context layers and identify the region under a point, with sources shown.

## Phase 5 — Ported capability: Image cascade with provenance

Goal: one representative image per taxon, everywhere tiles appear.

- [ ] `resolveTaxonImage(name, rank)`: **iNat default photo → Wikipedia → honest placeholder**,
      preloading each candidate and falling through on load failure (mirror QM Explorer's
      `resolveGroupImage`).
- [ ] **Rank-appropriate**: a family tile shows a family-level representative, not a random
      species. Cache results; evict placeholders so a blip doesn't lock a tile.
- [ ] Every image carries **attribution + provenance**. Reuse across Taxa, Field Guide, and the
      deep-dive panel. Lazy-load via IntersectionObserver + bounded pool.

Exit: Taxa/Field Guide/deep-dive tiles are image-rich, correctly attributed, and never blank
without an honest placeholder.

## Phase 6 — Public-app polish, a11y, mobile, publish

Goal: ship-quality.

- [ ] **Shareable URL state** — encode active filters/view so a link reproduces a lens.
- [ ] **Accessibility pass** — WCAG 2.1 AA across all new UI (contrast, keyboard, focus,
      labels, modal traps, reduced-motion).
- [ ] **Mobile pass** — real-device check: layout, map, modals, filter drawer, no overflow.
- [ ] **Performance** — lazy-load, throttle, virtualise large lists/ranks if needed.
- [ ] **License + attribution** finalised in README and in-UI.
- [ ] Final deploy to GitHub Pages; smoke-test the live URL on desktop + phone.

Exit: iNat Lab is live, fast, accessible, mobile-flawless, and genuinely shareable.

---

## Sequencing notes

- Phases 2–5 are independent enough to reorder, but **Phase 5 (image cascade) feeds Phase 3
  (deep-dive)**, so do 5 before or alongside 3 if pairing them.
- Keep each phase on its own branch; deploy to `main` per verified slice (QM Explorer's
  "push often, keep main live" model).
- After each phase, update `CLAUDE.md`'s "Current chapter" so a fresh session re-enters cleanly.
