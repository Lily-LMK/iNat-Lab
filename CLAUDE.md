# CLAUDE.md — iNat Lab

Project-level guidance, auto-loaded each session. This is the **specific truth for this
folder**; the workspace file at `~/Documents/Claude/CLAUDE.md` holds the broader working
philosophy (Explore → Plan → Code → Commit, biodiversity context, Lily's profile). Read
both. For the phased plan see `docs/ROADMAP.md`; the creative + feature spec that hands the
redesign to **Opus** is `docs/OPUS-BRIEF.md`; `docs/KICKOFF.md` is a ready-to-paste
session starter.

## What this is

A single-file, **no-build, keyless static web app** for exploring iNaturalist records —
loaded from a CSV export *or* pulled live from the iNaturalist API — so Lily can interrogate
a species and a record set more smoothly and cleanly than iNaturalist itself allows, and run
her **imaging / metadata workflow** (titles, captions, keywords, common-name enrichment,
taxon updates) over them.

- `index.html` — the entire app (~7,800 lines: HTML + CSS + JS inline). No framework, no
  build step. External deps load via CDN: **Leaflet 1.9.4** + **esri-leaflet 3.0.12**.
- No service worker yet (QM Explorer has one; add only if offline/caching becomes a need).
- Data is **never bundled** — it arrives at runtime. `.gitignore` blocks `*.csv` / `*.numbers`
  so personal exports never land in the public repo.

Five views today: **Records, Taxa, Field Guide, Dates, Map**, plus a metadata export modal.

## Current capabilities (before the redesign)

- **Ingest:** CSV upload (`#csvA`) and live **iNat API top-up** (`#fetchApi`) by username(s)
  and/or project, with an "add new / replace" mode and a result cap.
- **Filter cascade:** kingdom → phylum → class → order → superfamily → family → subfamily →
  tribe → genus → species, plus user, quality grade, date range, and free-text search.
- **A/B user comparison:** two users coloured blue (`--user-a`) / amber (`--user-b`) across
  badges, snapshot tiles, and map points.
- **Metadata engine:** title / caption / keyword modes; GBIF "enrich missing common names";
  "Update taxa" (`#taxonSyncBtn`) reconciles taxonomy against iNaturalist; export modal with
  copy-to-clipboard.
- **Map:** Leaflet + esri-leaflet; OSM / OpenTopoMap / satellite / Esri topo / GA geology
  basemaps; GBIF density tiles + clickable points. Points are coloured **by user** (not yet
  by taxonomy — that's a redesign target).

## Where this is going (see `docs/ROADMAP.md` + `docs/OPUS-BRIEF.md`)

Three intertwined goals, agreed with Lily:

1. **Port four QM Explorer capabilities** — (a) **map by taxonomic rank** (colour/cluster/
   legend by a chosen rank), (b) a **species deep-dive panel** (Wikipedia description,
   rank-appropriate common names, representative image, external links), (c) **spatial
   context layers** (IBRA/IMCRA bioregions, LGAs, geology, elevation), (d) an **image
   cascade with provenance** (one representative image per taxon: iNat → Wikipedia →
   honest placeholder, with attribution).
2. **A fresh, awwwards-calibre visual identity** — a distinctive new look (its own palette,
   type, motion), designed by **Opus**. Not a reskin of the current warm-paper/green theme.
3. **Publish to GitHub Pages, flawless on mobile** — public-shareable, so: no personal
   defaults, shareable URL state, real onboarding / empty / loading / error states.

## How to run / verify

No build. Serve the folder over http (not `file://`) so `fetch` and CORS behave:

```bash
python3 -m http.server 8000      # then open http://localhost:8000
```

…or VS Code **Live Preview**. Verify by clicking the real UI and watching the browser
console + network tab. Because the app is data-driven, keep a small **non-personal** sample
CSV handy for local testing (do not commit it).

## Conventions / house rules (inherited from the workspace + QM Explorer)

- **Single static file, no build.** Add libraries via CDN. Keep it self-contained and
  deployable to GitHub Pages.
- **Keyless.** No API keys in client code; use only public/anonymous endpoints
  (iNaturalist, GBIF, Wikipedia, and public spatial services).
- **Responsible API use.** Cache in-page, throttle, and **lazy-load** (resolve only what's
  visible — mirror QM Explorer's IntersectionObserver + bounded-pool pattern). Public
  services are fragile; never burst hundreds of requests.
- **Scientific integrity.** Preserve identifiers (iNat observation IDs, taxon IDs, UUIDs);
  separate evidence from inference; show provenance + attribution on every enriched value;
  make common names **rank-appropriate** (a family tile shows the family's name, not a random
  species'); a blank beats a mislabel.
- **Privacy (public app).** No hardcoded usernames or personal data. Sample/placeholder text
  only. Nothing personal ships in the repo.
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

## Current chapter

**Everything below is live on `main` and pushed** to `origin` (`Lily-LMK/iNat-Lab`, GitHub Pages).
Phase 1's "Gallery" identity + the mobile pass (off-canvas filters drawer ≤820px, compact header)
remain the baseline. Several `docs/HANDOFF.md` items are now done — see that file for the per-item
status and what's left. Verification throughout is via a headless-Chrome/CDP driver (native Node 24
`WebSocket`, no deps) loading the git-ignored `sample-inat.csv`; drivers live in the session scratchpad.

**Shipped this chapter** (all merged to `main` and pushed):

- **Search relocated + redesigned** (HANDOFF §6, DONE). Header search pill gone; `#q` is a minimal
  sidebar box (magnifier + clear-✕, empty placeholder, label moved to `aria-label`). Sidebar filter
  order is **Taxon menu → Search → the rest** (User/Quality/Compare/Date).
- **Active-filters bar** in the freed header centre slot. `renderFilterChips()` renders from the
  central `app.f` state in RANKS order. Taxonomy is a **`value › value` breadcrumb** (no pills, no
  rank labels); each value is click-to-remove and clears its downstream ranks (`clearTaxonFromRank`).
  Independent filters (User/Quality/Date/Search) are minimal labelled items; Date only when it
  narrows the set. **Clear all** at the far right (reuses Reset).
- **Records ⇄ Field Guide hop** (HANDOFF §3, DONE). A Records-card trail-rank click sets the taxon
  filter and hops to the Field Guide focus; higher ranks land on the **one-of-each-species plate**,
  a species-level click drops to that species' records. Filter is retained, so back-to-Records shows
  all of that taxon. (`applyLineageKey` + `data-rank` routing in `renderRecords`.)
- **Field Guide = visual field guide, not a dashboard.** The focus view's analytics panel
  (records-per-month chart, quality-grade summary, occurrence stats, by-user) is **removed**; nav
  controls (Records view / index / View on iNaturalist) moved into a **compact header row**; the view
  is a **single full-width image gallery** with enlarged tiles; **default mode = "one of each
  species."** `computeOccurrence`/`renderMonthBars` are left defined for the future deep-dive.
- **Image-first tiles.** Field Guide index tiles (`.guideCard`/`.guideList`) and the focus plate lead
  with a **representative photo from the loaded records** (`r._img`) + honest placeholder; occurrence
  text follows. Tile grids are responsive (`auto-fill, minmax(210px…)`, 150px narrow) and consistent
  between index and plate.
- **Header tidy.** Removed the CSV filename display (the load toast already names the file).

**Decisions:** tab label stays **"Field Guide"** (not renamed to "Browse" — Lily's call for now).
Tile images come from **our own iNat records only**; the multi-source cascade is not built yet.

**Not yet done** (next session, from `docs/HANDOFF.md`): **§5 image cascade** (iNat→Wikipedia→
placeholder, lazy IntersectionObserver + bounded queue — currently just `r._img`, no fallback/lazy
pool); **§2 Taxa** aligned to QM's two-action model + auto-expand-to-active-path; **§4 Records card**
full redesign (the **⌖ U+2316** observer marker replacing the name+dot and the 📍 place; Order added to
the clickable trail — only the trail hop is done so far); **§7 service worker / offline + eager
cache-warming on import**. Then the original roadmap: map-by-rank (Phase 2), species deep-dive
(Phase 3), spatial context layers (Phase 4), publish polish + shareable URL state (Phase 6).

---

### Phase 1 detail (archived)

**Phase 1 — "Gallery" editorial identity.**
Lily reviewed a first attempt (a dark "Nocturne" look) and **pivoted**: it read elementary and
leaned on emoji. New agreed direction — a **light-default, editorial, photographer-portfolio
aesthetic**: gallery-monochrome (near-colourless UI so the photographs are the colour),
**one typeface (Inter)** in a Swiss/gallery register, readability paramount, Resilient-Web-Design
discipline (semantic HTML, progressive enhancement), **no emoji as decoration**. A **dark theme
is opt-in via a header toggle; light is the default and remembered.** (An intermediate Nocturne
commit remains in branch history.)

Delivered on the branch (not merged to `main`, not pushed):

- **Gallery token system** in `:root` (+ `[data-theme="dark"]` warm-charcoal variant). Paper
  `--bg:#FBFAF7`, ink `--ink:#1A1A17`, hairlines, `--accent` = **ink** (no bright colour;
  emphasis via ink fills / underlines / weight). Same token *names* as before, so components
  cascade. `--card-radius:4px`, whisper `--shadow` (hairlines do the work).
- **Inter only** via CDN (variable, incl. italic for scientific names). Space Grotesk / JetBrains
  Mono dropped.
- **Theme toggle** (`#themeToggle`): anti-FOUC init script in `<head>` reads
  `localStorage['inatlab-theme']`; button flips `data-theme` on `<html>`, persists, re-renders
  canvas-ish views (Dates heat is theme-aware). Light default always.
- **Editorial shell**: ink-on-paper masthead (no green header), **underline text-nav** tabs,
  hairline cards, quiet hover (no glow). **Emoji removed** — brand leaf gone; "no image"
  placeholder + sidebar toggle now use **minimal inline line-SVGs**; onboarding rebuilt as a
  centred wordmark + hairline rule + two CTAs (ink-filled primary) + a 3-column hairline feature
  grid. Monochrome ink heat-ramp for Dates.
- Kept from before: keyboard-operable tabs (`role=tab`, arrows, `aria-selected`),
  `:focus-visible` rings, `prefers-reduced-motion` guard, mobile status-line wrap.

**Renamed** all **Fable → Opus** across the docs (`docs/FABLE-BRIEF.md` → `docs/OPUS-BRIEF.md`);
none remain in project files. (Note: the git commit co-author trailer is a fixed harness line
that still reads "Claude Fable 5" — cannot be renamed; flagged to Lily.)

**Verified** via headless-Chrome/CDP screenshots (git-ignored `sample-inat.csv`; driver in the
session scratchpad) across Records/Taxa/Field Guide/Dates/Map + onboarding, **light and dark**,
at 1440px and 390px. Five views + ingest/metadata engine intact.

**Breadcrumbs + one-of-each-species browse — DONE (verified).** In the Field Guide focus view:
- **Semantic breadcrumb** (`<nav class="crumbs"><ol>`): a root "Guide" link + one crumb per
  populated ancestor rank, current = `aria-current`, chevron separators. Path keys derived from
  a representative row via `pathKeyFromRowAtRank` (canonical order) — sidesteps a latent
  Family/Superfamily ordering bug in the old crumb code.
- **"One of each species"** via a `.segmented` toggle (Immediate children ⇄ One of each species).
  Species mode dedupes `app.filteredIdx` to distinct species (`lineageArrayFromRow(r)[6]` →
  `_sci` fallback), one representative tile each (prefers a row with an image), regardless of
  intervening ranks — e.g. Order *Diprotodontia* → 3 species tiles. State: `app.guideChildMode`.
  Verified by CDP drill (Guide → Diprotodontia → species plate). Images still fall back to the
  "no image" placeholder — the iNat→Wikipedia cascade (Phase 5) will fill them.

Also removed the last emoji (🔗 → inline external-link SVG).

**Next:** merge Phase 1 to `main`, then Phase 2 (map by taxonomic rank). Map basemap is light OSM
(now harmonises with the light UI); Leaflet zoom controls still default — revisit in Map phases.
The image cascade (Phase 5) will make the species plate and guide tiles image-rich.
