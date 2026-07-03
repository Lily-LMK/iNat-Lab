# CLAUDE.md — iNat Lab

Project-level guidance, auto-loaded each session. This is the **specific truth for this
folder**; the workspace file at `~/Documents/Claude/CLAUDE.md` holds the broader working
philosophy (Explore → Plan → Code → Commit, biodiversity context, Lily's profile). Read
both. For the phased plan see `docs/ROADMAP.md`; the creative + feature spec that hands the
redesign to **Fable** is `docs/FABLE-BRIEF.md`; `docs/KICKOFF.md` is a ready-to-paste
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

## Where this is going (see `docs/ROADMAP.md` + `docs/FABLE-BRIEF.md`)

Three intertwined goals, agreed with Lily:

1. **Port four QM Explorer capabilities** — (a) **map by taxonomic rank** (colour/cluster/
   legend by a chosen rank), (b) a **species deep-dive panel** (Wikipedia description,
   rank-appropriate common names, representative image, external links), (c) **spatial
   context layers** (IBRA/IMCRA bioregions, LGAs, geology, elevation), (d) an **image
   cascade with provenance** (one representative image per taxon: iNat → Wikipedia →
   honest placeholder, with attribution).
2. **A fresh, awwwards-calibre visual identity** — a distinctive new look (its own palette,
   type, motion), designed by **Fable**. Not a reskin of the current warm-paper/green theme.
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

**Phase 1 — Nocturne design system & shell (in progress, branch `phase1-design-system`).**
Lily chose the **Nocturne** direction (bio-luminescent dark) from three options. Delivered so
far on the branch (not yet merged to `main`, not pushed):

- **New token system** in `:root` — Nocturne surfaces (`--bg`/`--panel`/`--raised`/`--field`/
  `--panel-glass`), ink scale, lumina accent (`--accent:#3ddc97`) + aqua (`--accent2`), accent
  tint tokens (`--accent-soft`/`--accent-line`/`--focus`/`--glow`), and a motion vocabulary
  (`--ease`, `--dur-fast|dur|dur-slow`). One source of truth; the app inherits it.
- **Fonts via CDN** — Space Grotesk (display/headings), Inter (UI/data workhorse), JetBrains
  Mono (identifiers/coords). `--font` now maps to Inter app-wide.
- **Full dark conversion** — every light-theme literal (whites, warm-paper tones, forest-green
  tints, `rgba(0,0,0)` borders, map chrome) remapped to tokens; form controls get light text +
  recessed fields + accent focus rings; `color-scheme: dark` fixes native widgets; the Dates
  heat ramp is re-tuned cool→warm-luminous; the user/map palette brightened to glow on dark.
- **Shell + components** restyled (header, tabs, sidebar, cards, tiles, modals, legend, toasts)
  without changing IDs/behaviour. **Motion** layer (`nlFadeUp` view reveals, hover glows) +
  full **`prefers-reduced-motion`** guard. **Focus-visible** rings app-wide.
- **Onboarding** first-run panel elevated (wordmark + tagline + "Load a CSV" / "Pull from
  iNaturalist" CTAs + drag hint + 3 feature blurbs). Tabs made keyboard-operable
  (`role=tab`, arrow keys, `aria-selected`) and the mobile status line fixed to wrap full-width.

**Verified** via headless-Chrome + CDP screenshots (loads git-ignored `sample-inat.csv`;
driver kept in the session scratchpad) across Records/Taxa/Field Guide/Dates/Map + onboarding,
at 1440px and 390px. All five views + ingest/metadata engine intact.

**Known follow-ups (not blocking Phase 1):** the Leaflet **basemap is still light OSM** — a
dark default basemap (e.g. Carto dark) would complete the Nocturne map; Leaflet's own zoom
controls are still light. Both belong in the Map phases (2/4).

**Next:** confirm the identity with Lily, merge to `main`, then Phase 2 (map by taxonomic
rank). The existing five views and the metadata/ingest engine must keep working throughout —
elevate, don't regress.
