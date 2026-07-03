# iNat Lab — Creative & Feature Brief for Opus

Opus, this is the handover. You're designing and building a **fresh, awwwards-calibre visual
identity** for iNat Lab and folding in **four capabilities** from its sibling project, QM
Explorer. Read `../CLAUDE.md` and `ROADMAP.md` first; this file is the creative and functional
spec. Lily leads the vision; you lead the craft. Bring initiative — this brief sets intent and
constraints, not pixel dictates.

---

## 1. What iNat Lab is (and who it's for)

iNat Lab lets a naturalist load their **iNaturalist** records — from a CSV export or live via
the iNat API — and *interrogate* a species and a record set far more smoothly than
iNaturalist's own site allows: filter down a full taxonomic cascade, compare observers, map
observations, and run an imaging/metadata workflow (titles, captions, keywords, common-name
enrichment, taxonomy reconciliation).

It's built by Lily — a museum collection photographer and field naturalist around Mount Nebo,
Queensland — but this version is **publicly shareable**. Treat it as a tool a curious stranger
could open cold and understand, while a power user (Lily) can still drive it hard.

The current app works but looks generic. Your job: make it feel like a **crafted instrument
for looking closely at the living world** — and make the four new features feel native, not
bolted on.

## 2. The design mandate: a fresh, distinctive identity

Lily chose a **fresh distinctive identity**, not a reskin of the current warm-paper/forest-
green theme. So invent a new visual language. Aim for something an awwwards jury would notice:
distinctive, coherent, confident, and *appropriate to biodiversity* — never decoration for its
own sake over legibility of scientific data.

**What "awwwards-worthy" means here** (their four axes — design, usability, creativity,
content — reframed for this app):

- **Design** — a real system: a considered palette, a type pairing with a clear scale, a
  spatial rhythm, intentional elevation and motion. Every screen feels like the same object.
- **Usability** — dense data stays legible and fast; nothing sacrifices the workflow for looks.
  Mobile is first-class, not an afterthought.
- **Creativity** — a distinctive point of view. A memorable identity, a signature interaction
  or two, a sense that a person with taste made this.
- **Content** — the data is the hero. Specimen/observation imagery, taxonomy, and maps should
  feel rich and trustworthy, with provenance visible.

**Creative direction (intent, not prescription — you design the specifics):**

- **Mood options to explore** (pick/blend, then commit): *field-notebook-meets-lab-instrument*
  (precise, gridded, archival, tactile); or *specimen-drawer / cabinet-of-curiosity* (deep
  neutrals, imagery as jewels, museum restraint); or *bio-luminescent dark* (a considered dark
  mode where photos and map data glow). Distinct from QM Explorer's warm-paper look.
- **Type:** a distinctive display face for headings + a highly legible workhorse for data/UI.
  Load via CDN (Google Fonts / self-hosted-from-CDN). Keep a mono for identifiers/coordinates.
- **Colour:** design a full token set (surfaces, ink, muted, hairline, accent(s), semantic
  states, and a **categorical scale** for the map's rank colouring — this is a real design
  problem: it must stay distinguishable at 8–12 categories and be colour-blind-considerate).
- **Motion:** a small, tasteful motion vocabulary (view transitions, tile reveals, map/legend
  interactions). Must honour `prefers-reduced-motion`.
- **Imagery-forward:** the app is full of photos and maps — let them breathe; frame them well;
  give every image an honest placeholder when none exists (see §5.4).

Deliver the identity as **CSS custom properties** replacing the current `:root` block, so the
whole app inherits it from one source of truth.

## 3. Hard constraints (do not break these)

- **Single file, no build.** Everything stays inline in `index.html`. No framework, no bundler.
  Add libraries only via **CDN** (Leaflet + esri-leaflet already are).
- **Keyless & static.** No API keys in client code. Only public/anonymous endpoints. Deploys
  to **GitHub Pages**.
- **Keep the engine running.** The existing five views (Records, Taxa, Field Guide, Dates,
  Map), the **CSV + API ingest**, the **filter cascade**, **A/B user compare**, and the
  **metadata export** (titles/captions/keywords, GBIF common-name enrichment, "Update taxa")
  must all keep working. Elevate them; don't regress them. Preserve element IDs and behaviours
  where you can, so the JS keeps wiring up.
- **Mobile-flawless.** Works from 320px up. No horizontal overflow. Touch targets ≥ 44px. The
  map, modals, and filter UI must be genuinely usable on a phone.
- **Accessibility — WCAG 2.1 AA.** Keyboard nav, visible focus, labels, ARIA where it helps,
  modal focus traps, sufficient contrast, reduced-motion. Non-negotiable.
- **Public-app privacy.** No hardcoded usernames or personal data. Placeholder text only.
  Nothing personal in the repo (`.gitignore` blocks CSVs).
- **Responsible API use.** Cache in-page, throttle, and **lazy-load** (resolve only what's
  visible). Public services are fragile — no bursts of hundreds of requests.
- **Scientific integrity.** Preserve identifiers (iNat observation IDs, taxon IDs, UUIDs);
  separate evidence from inference; show **provenance + attribution** on every enriched value;
  make common names **rank-appropriate**; **a blank beats a mislabel.**

## 4. Current architecture (where to work)

`index.html`, ~7,800 lines, HTML + CSS + JS inline. Key entry points you'll touch:

- App state lives in one mutable object (as in QM Explorer's `S`). Trace it before editing.
- View router: `if(tab === "map") renderMap(view)` etc. Views: Records gallery renderer, Taxa
  tree, Field Guide (`renderGuide`), Dates, `renderMap` (~line 4053).
- Map internals: Leaflet map build, basemap layers, GBIF density/points, user A/B colouring
  (`--user-a` blue, `--user-b` amber). Rank colouring is a *new* dimension over this.
- Ingest: CSV (`#csvA` / `#loadCsvBtn`) and API (`#fetchApi`, `#apiUsers`, `#apiProject`,
  `#apiMode`, `#apiMax`).
- Metadata: export modal (`#exportModal`), title/caption/keyword modes, GBIF enrichment
  (`#enrichCommonGbif`), taxon sync (`#taxonSyncBtn`).

## 5. The four ported capabilities

Port the *spirit and rigour* of QM Explorer's versions, adapted to iNaturalist data. QM
Explorer's own patterns are documented in `../../QM-Explorer/CLAUDE.md` — read it; reuse its
lazy-load + provenance discipline.

### 5.1 Map by taxonomic rank (Lily's headline example)

- A **"Colour by"** control on the Map: `User` (current behaviour) | `Order` | `Family` |
  `Genus` | (any available rank). Switching rebuilds a **categorical colour scale** over that
  rank's values (design that scale in §2).
- A **legend** with per-category counts. Clicking a legend entry highlights/filters that taxon
  on the map. Optional low-zoom **clustering** that respects the colouring.
- Reuse the existing marker plumbing; keep A/B user mode as one selectable option. **Honestly
  label** records with no coordinate — never silently drop them.

### 5.2 Species deep-dive panel

- Openable from any species reference (Records tile, Taxa leaf, Field Guide tile, map point).
- Shows: **Wikipedia** description (link + attribution), **rank-appropriate common name(s)**,
  a representative **image** (via §5.4), a **mini stat block** from the loaded set (observation
  count, date span, top places, top observers), and **external links** (iNat, GBIF).
- Accessible drawer/modal (focus trap, Esc, reduced-motion). Cache and lazy-load every fetch;
  show provenance per field.

### 5.3 Spatial context layers

- Toggleable map overlays: **IBRA/IMCRA bioregions**, **LGAs**, **geology**, **elevation** —
  start with whichever public services are reliable and CORS-friendly (esri-leaflet is already
  loaded; QM Explorer talks to Qld Gov / Geoscience Australia / GA services).
- Click-to-identify where supported (region name + source). Overlays off by default. Layer
  control must work on mobile. Honest failure states when a service is blocked/offline.

### 5.4 Image cascade with provenance

- `resolveTaxonImage(name, rank)`: **iNat default photo → Wikipedia → honest placeholder**,
  preloading each candidate and falling through on load failure (mirror QM Explorer's
  `resolveGroupImage`). **Rank-appropriate** representative image. Cache; evict placeholders so
  a transient failure doesn't lock a tile. Every image carries **attribution + provenance**.
- Reuse across Taxa, Field Guide, and the deep-dive panel. Lazy-load via IntersectionObserver +
  a bounded request pool (QM Explorer's `_queueGuideImg` pattern).

## 6. Public-app requirements

- **Onboarding / empty state:** first-run explains what iNat Lab is and offers "Load a CSV" /
  "Pull from iNaturalist". No blank screen.
- **Shareable URL state:** encode the active view + filters so a link reproduces a lens.
- **Honest states** everywhere: loading, empty, error — distinct and legible. Never fake data
  to hide a failure.

## 7. How to work

- **Phase it** (see `ROADMAP.md`). Small, verifiable slices on feature branches; deploy to
  `main` per verified slice. Keep `main` live.
- **Verify in a real browser** each slice: serve over http, click the actual UI, watch console
  + network. Test with a **non-personal sample CSV** (git-ignored) and on a **mobile viewport**.
- **Commit** with clear messages; verify before committing; push when Lily asks.
- After each phase, update the **"Current chapter"** in `../CLAUDE.md` so the next session
  re-enters cleanly.
- When unsure between two good design directions, **show Lily options** rather than guessing —
  she values the collaboration and wants to see the thinking.

## 8. Definition of done

iNat Lab is live on GitHub Pages with a distinctive, coherent identity; the four ported
capabilities feel native; the original ingest/filter/metadata engine is intact; it is
WCAG 2.1 AA, mobile-flawless, keyless, single-file; images and enriched values show provenance;
and a stranger can open it cold and understand it while Lily can still drive it hard.
