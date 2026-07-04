# CLAUDE.md — iNat Lab

Project-level guidance, auto-loaded each session. This is the **specific truth for this
folder**; the workspace file at `~/Documents/Claude/CLAUDE.md` holds the broader working
philosophy (Explore → Plan → Code → Commit, biodiversity context, Lily's profile) — read
both. `docs/ROADMAP.md` holds the phased plan and `docs/NEXT-SESSION.md` the immediate next
actions + backlog. (Detailed session history lives in git; the Phase 1 creative briefs were
retired once shipped.)

## What this is

A single-file, **no-build, keyless static web app** for exploring iNaturalist records —
loaded from a CSV export *or* pulled live from the iNaturalist API — so Lily can interrogate
a species and a record set more smoothly and cleanly than iNaturalist itself allows, and run
her **imaging / metadata workflow** (record titles, keywords, taxonomy sync) over them. It is
**live on GitHub Pages** (`Lily-LMK/iNat-Lab`).

- `index.html` — the entire app (~7,000 lines: HTML + CSS + JS inline). No framework, no
  build step. CDN deps: **Inter** (Google Fonts), **Leaflet 1.9.4**, **esri-leaflet 3.0.12**.
- `sw.js` — a service worker that caches the **app shell** so the page loads offline once
  visited. Data is never cached — only the shell.
- Data is **never bundled** — it arrives at runtime. `.gitignore` blocks `*.csv` / `*.numbers`
  so personal exports never land in the public repo.

Five views: **Records, Taxa, Field Guide, Dates, Map** — plus a record-detail modal and a
generic CSV export modal.

## Current capabilities

- **Ingest:** CSV upload (`#csvA`) and live **iNat API top-up** (`#fetchApi`) by username(s)
  and/or project, with a top-up / full-import mode and a result cap.
- **Filter cascade:** kingdom → phylum → class → order → superfamily → family → subfamily →
  tribe → genus → species, plus user, quality grade, date range, and free-text search. Active
  filters render as a **chip bar** in the header; "Clear all" (`clearAllFilters()`) resets them.
- **A/B user comparison:** two users coloured teal (`--user-a`) / terracotta (`--user-b`)
  across badges, snapshot tiles, and map points. Observers use a theme-aware **12-hue palette**
  (`USER_PALETTE_LIGHT`/`_DARK`).
- **Record metadata:** the record-detail modal produces a **Title** and **Keywords** at fixed
  default formats (Copy title / Copy keywords). **"Update taxa"** (`#taxonSyncBtn`) reconciles
  taxonomy against iNaturalist; taxon/photo enrichment fills breadcrumb ancestors and modal
  images. *(The old "Lightroom" title/caption/keyword dropdowns and GBIF common-name enrichment
  were removed — do not reintroduce them.)*
- **Map:** Leaflet + esri-leaflet; **Streets (OSM) / Topo (OpenTopoMap) / Satellite (ArcGIS) /
  Esri Topo / GA Surface Geology** basemaps, with click-to-identify on the geology layer. Points
  are coloured **by a chosen taxonomic rank or by user**, with a live legend (see Phase 2).

## Roadmap / where this is going (see `docs/ROADMAP.md`)

**Phase 1 — the "Gallery" editorial identity** (light default, single typeface Inter,
hairline/monochrome UI so photographs are the colour, opt-in dark theme) is **shipped and is
the baseline.** Remaining phases:

1. **Phase 2 — Map by taxonomic rank.** *Core is built* (colour + legend by rank). Remaining,
   agreed with Lily: (a) a **curated colour-blind-safe palette with per-category custom colours**,
   (b) **clustering + spiderfy** (Leaflet.markercluster), (c) a **clean vector / high-DPI
   point-map export** for publication (no web basemap tiles). Build order a → b → c.
2. **Phase 3 — Species deep-dive panel** (Wikipedia description, rank-appropriate common names,
   representative image, external links).
3. **Phase 4 — Spatial context layers** (IBRA/IMCRA bioregions, LGAs, geology, elevation).
4. **Phase 5 — Publish polish:** shareable URL state, real onboarding / empty / loading / error
   states, and an accessibility + mobile + performance pass.

## How to run / verify

No build. Serve the folder over http (not `file://`) so `fetch` and CORS behave:

```bash
python3 -m http.server 8000      # then open http://localhost:8000
```

…or VS Code **Live Preview**. Verify by clicking the real UI and watching the browser
console + network tab. Because the app is data-driven, keep a small **non-personal** sample
CSV handy (`sample-inat.csv`, git-ignored) for local testing — do not commit it.

## Conventions / house rules (inherited from the workspace + QM Explorer)

- **Single static file, no build.** Add libraries via CDN. Keep it self-contained and
  deployable to GitHub Pages (plus `sw.js`).
- **Keyless.** No API keys in client code; use only public/anonymous endpoints
  (iNaturalist, Wikipedia, and public spatial services).
- **Responsible API use.** Cache in-page, throttle, and **lazy-load** (resolve only what's
  visible — mirror QM Explorer's IntersectionObserver + bounded-pool pattern). Public
  services are fragile; never burst hundreds of requests.
- **Scientific integrity.** Preserve identifiers (iNat observation IDs, taxon IDs, UUIDs);
  separate evidence from inference; show provenance + attribution on every enriched value;
  make common names **rank-appropriate** (a family tile shows the family's name, not a random
  species'); a blank beats a mislabel.
- **Privacy (public app).** No private/personal data or hardcoded personal *defaults* in the
  repo; sample/placeholder text only. *(Exception, agreed with Lily: her own iNaturalist
  username may appear as a placeholder example — her observations are public and meant to be
  shared. Don't re-flag this.)*
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

**Most recent work — sidebar reorg + compare redesign + three requested UI fixes**
(`~/.claude/plans/wild-churning-globe.md`). On branch **`sidebar-reorg-ui-polish`**, committed
but **not yet merged to `main` or pushed** (awaiting Lily's go-ahead):

- **Sidebar reconsidered.** New order **Snapshot · Filters · Date · Compare users · Add
  records** — Snapshot promoted to the top; Compare users demoted to its own **collapsed-by-
  default** panel. That panel was **redesigned**: teal/terracotta A/B colour swatches
  (`--user-a`/`--user-b`) sit beside the Compare A / Compare B labels, plus a quiet **"Clear
  comparison"** link (`#cmpClear` + `syncCmpClear()`) shown only when both are set.
- **Removed the chip-bar "Clear all"** and its now-orphaned `clearAllFilters()` + `.chip-clear`
  CSS (x-ing a parent taxon chip already cascades to clear downstream ranks). *(Supersedes
  Part 2's note below — that function no longer exists.)*
- **Uniform Field Guide focus-header buttons.** `.smallBtn` now sets `color:var(--ink)`,
  `text-decoration:none`, `box-sizing:border-box`, fixed `line-height` — the "View on
  iNaturalist" anchor no longer inherits link-blue and matches the buttons' height. The `↩` on
  the "{Rank} index" button became a clean inline SVG chevron.
- **Breadcrumb clicks now filter Records** (not a Field Guide hop) in both the record-detail
  modal and the map popup — matches the record-card trail.

**Earlier — the sidebar/header cleanup plan**
(`~/.claude/plans/we-are-going-to-declarative-hearth.md`), Parts 1–4, all shipped:

- **Part 1 — removed the Lightroom metadata engine** (three format dropdowns + dead code); the
  record modal keeps Copy title / Copy keywords at default formats.
- **Part 2 — slimmed the header:** "Update taxa" moved into the sidebar; "Reset" removed, with
  its logic extracted to `clearAllFilters()` for the chip-bar "Clear all".
- **Part 3 — fixed the mobile off-canvas drawer scroll.** Two root causes: the drawer was
  `box-sizing:content-box`, so its fixed `top:0/bottom:0` never bounded it → gave it explicit
  `height:100dvh` + `border-box`; and this app scrolls the **body** as its container, which iOS
  won't lock via `overflow:hidden` → added a JS `position:fixed` body scroll-lock in
  `openDrawer`/`closeDrawer`. Real-iPhone sign-off from Lily received.
- **Part 4 — flattened the sidebar** to quiet hairline sections (no nested boxes) and regrouped
  into **FILTERS · COMPARE USERS · DATE · SNAPSHOT · ADD RECORDS**.

Earlier chapters — the Phase 1 Gallery identity, the full 10-rank taxonomy backbone + seven
navigation improvements, search relocation, the active-filters chip bar, the Records ⇄ Field
Guide hop, the Field Guide rework, the Records card redesign, the single-scroll-container
refactor, and the Taxa tree redesign — are all shipped. See git history and
`docs/NEXT-SESSION.md` for detail.

**Next up:** Phase 2 map work, **Step 1 (curated + custom palette)**. Standing decisions: tab
label stays **"Field Guide"**; tile images use own records only with an honest placeholder;
publication export is **clean vector / high-DPI, no basemap tiles**.
