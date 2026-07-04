# iNat Lab — Handoff brief (Phase 2 onward)

Phase 1 (the "Gallery" light-editorial identity + light/dark toggle + breadcrumbs +
one-of-each-species browse) is **done and merged to `main`** (not yet pushed). This document
captures the **next set of required changes** Lily specified, studied against **QM Explorer's**
`index.html` and `sw.js` (its sibling app at `../QM-Explorer/`), which is the pattern source.

House rules still hold: single-file `index.html`, no build, keyless, CDN-only, WCAG 2.1 AA,
mobile-first, honest provenance, light default. Work in small verifiable slices on a branch;
verify in a real browser (the headless-Chrome/CDP driver in the session scratchpad loads the
git-ignored `sample-inat.csv`); keep `main` deployable; push only when Lily asks.

Line numbers below are **QM Explorer's** `index.html` unless prefixed `iNatLab:`.

---

## Progress (updated 2026-07-04) — all shipped work is on `main`, pushed

| Item | Status | Notes |
|---|---|---|
| §1 Field Guide → Browse behaviour | **Partial** | Image tiles in the index **done** (uses `r._img`); breadcrumb + one-of-each toggle already there; **tab kept as "Field Guide"** (Lily's call), URL state not done. The focus view was also reworked into an image-first gallery (see below). |
| §2 Taxa aligned to QM | **DONE** | Full tree redesign: flat `<details>/<summary>` rows with chevron expand/collapse, hover-reveal **Guide** + **GBIF** actions, name-click filters Records, auto-expands to the active filter path on render, depth selector (Order→Species), Expand all / Collapse all / Export CSV toolbar. Visual: ink rows, `treeRankLabel` rank badges, muted action buttons that come forward on row hover. |
| §3 Records ⇄ Browse hop | **DONE** | Trail-rank click sets filter + hops to the Field Guide focus (species plate for higher ranks; species→records). Filter retained on return. |
| §4 Records card redesign | **DONE** | Username line + pin removed; observer shown as a colour-coded **⌖ crosshair marker** (inline SVG, `title`/`aria-label` for a11y) before the locality; taxonomic **order removed** from the card (reverses "Order in trail"); trail contrast raised (`--muted2`→`--muted`); card body reordered to Image · sci · common · date · ⌖place · trail. Verified light + dark. |
| §6 Search bar redesign | **DONE** | Moved into the sidebar (Taxon menu → Search → rest), minimal box, empty placeholder, ✕ clear. Header space became the active-filters chip bar. |
| §7 Service worker / offline + warm-up | **TODO** | Not started. |

**Also shipped this chapter (not in the original list):**
- **Active-filters chip bar** (`renderFilterChips`, breadcrumb of taxon values + minimal labelled chips, click-to-remove with downstream clearing, Clear all, wraps to a second line).
- **Field Guide focus rework** (analytics panel removed, nav in a compact header, single-column image gallery, default "one of each species"; duplicate breadcrumb removed; header buttons unified to `smallBtn`).
- **Responsive tile grids** matching the species plate; **header cleanup** (CSV filename removed).
- **Single scroll container refactor** (branch `single-scroll-refactor`, merged). Collapses the fixed-height shell to a window scroller: `body` now scrolls the whole app; `aside` is `position:sticky`; `.content`/`#view` has no `overflow:auto`. **Eliminates the nested-scroll rubber-band bug class.** Map height re-based to `min(72vh,760px)` (viewport-relative, no fixed-parent dependency). `--header-h` published via `ResizeObserver` so the sticky sidebar tracks header wrap correctly. Trackpad sign-off still needed on Lily's real Mac.

**Suggested next:** **real-trackpad sign-off** (scroll bounce — needs Lily's MacBook Pro), then **§7 service worker / offline + warm-up**, then **visual polish** (`NEXT-SESSION.md §3`), then **Phase 2 map-by-rank**. (§2 Taxa, §4 Records card, responsive mid-width, single-scroll refactor, and the UI cleanups are all **DONE**.)

---

## 1. Replace "Field Guide" with a QM-style **Browse** (and match its behaviour)

Rename the tab **Field Guide → Browse** (QM's Browse tab is literally `data-v="guide"`, so the
internal `guide` id already matches — just change the visible label and elevate behaviour).

**Study — QM `renderGuide()` (2532) + `renderGuideFocus` (~2760) + `guideBack()` (2109):**
- Header "Browse" + a one-line crumb; **rank pills** (QM: Phylum/Order/Family/Genus — for iNat
  Lab use the iNat ladder: Order / Superfamily / Family / Genus / Species).
- **Index** = one **image tile per group** at the chosen rank (name; italic for genus/species;
  vernacular; record count), sorted by count, capped (~200) with a "top N" note.
- **Drill** = `S.guideFocus={rank,name}; setFilterSilent(rank,name); renderGuide(); pushURLState()`
  (2617) — note it **sets the filter *and* focuses**, so Records/Map stay in sync. `guideBack()`
  (2109) clears that rank's filter and re-searches.
- **Tile images come from our own record photos** (`r._img`); un-photographed tiles get the honest
  placeholder. (iNat Lab keeps its own-records-only approach — no multi-source image resolution.)

**iNat Lab adaptation:** iNat Lab is CSV/iNat-API-driven, not ALA facets — group `app.filteredIdx`
by the chosen rank (the current `renderGuide` at `iNatLab:~2953` already does this). Keep the
**breadcrumb** and the **"one of each species"** toggle already built in Phase 1 — they fit QM's
model. What's missing vs QM: **image tiles in the index** (currently text cards) and **URL state**
(`pushURLState`).
**Rank pills = Order / Superfamily / Family / Genus** (no Species pill). **Decision (Lily):
"one of each species" stays as the per-focus toggle only** — you reach a species plate by focusing
a group and toggling, not via a top-level Species rank.

## 2. Make the **Taxa** module behave like QM's

**Study — QM `renderTaxa()` (1874):** a lazy taxonomy **tree** (facets → children on expand),
**auto-expands to the active filter path**, and each node has two actions:
- `[data-a="filter"]` → `applyTaxonFilter(rank,name)` (jump to **Records** filtered to that taxon).
- `[data-a="guide"]` → `S.guideFocus={rank,name}; switchView('guide')` (jump to **Browse** focused
  on that taxon) — **2099**.

**iNat Lab adaptation:** iNat Lab's Taxa tree (`iNatLab:renderTaxa ~3480`) already lists ranks with
Filter/Guide/GBIF buttons — align them to QM's two-action model (**Filter → Records**,
**Guide → Browse focused**), keep lazy expansion, and add **auto-expand to the active filter path**.

## 3. **Records ⇄ Browse** hop (the key interaction Lily called out)

> "If I select a taxonomic rank (e.g. click Noctuoidea) I hop to Browse and see one of every
> species in the record set. If I jump back to Records, I see all Noctuoidea records, full stop."

**Decision (Lily): yes — clicking a rank in a Records card hops to Browse** (not just filter).
This is QM's dual behaviour combined: a **taxon-trail click sets the filter *and* focuses Browse**.
- QM Records cards carry a taxonomic trail of `.tax-link[data-rk][data-nm]` (1836); a delegated
  handler calls `applyTaxonFilter` (1862). QM Taxa nodes hop to Browse via `guideFocus + switchView`
  (2099).
- **For iNat Lab:** a trail-rank click should do **`setFilterSilent(rank,name)` + `guideFocus={rank,name}`
  + `switchView('guide')`** and render the **one-of-each-species** plate for that taxon. Because the
  filter is set, **switching to Records then shows *all* records of that taxon** — no extra work.
  Provide a clear "**View all N records**" affordance in the Browse focus (QM's `guideBack`/Records
  button, `iNatLab:` guide focus already has a "Records view" button — wire it to keep the filter).

## 4. Redesign the **Records** cards — **DONE** (verified light + dark, 2026-07-04)

**Card hierarchy (top → bottom), per Lily:** Image · **Scientific name** · Common name · Date ·
**⌖ Place** · **Taxonomic trail**. Shipped in `renderRecords` (`iNatLab:~3865`).

- **Observer marker — DONE.** The username line and the map-pin are gone. Before the place text sits
  an **observer marker coloured by `userColor(user)`** — **no name** (the colour signifies the
  observer), with the username kept as `title` + `aria-label` so it is not conveyed by colour alone
  (WCAG 1.4.1). The marker is a small **inline SVG crosshair** (⌖-style): a Unicode `⌖` could not be
  reliably weighted/enlarged (symbol-font fallback ignores `font-weight`), so an SVG with a real
  `stroke-width` gives controllable weight + size and reads on both themes. CSS: `.card-place .uMark`.
- **Taxonomic order removed from the card entirely (Lily).** The date line is date-only; the trail
  starts at superfamily/family (Order was already skipped at `ci===0`). **This reverses the earlier
  "Order added to the clickable trail" sub-decision** — see Decisions #5 below.
- **Trail** = (superfamily) › family › (subfamily) › (tribe) › genus › species, each a `.fgLink`
  that triggers the §3 hop. **Contrast raised** from `--muted2` to `--muted` (≈2.4:1 → ≈5.3:1 on
  light paper) at Lily's request — the trail was too faint.
- **Observer palette — theme-aware 12-hue calm set** (`USER_PALETTE_LIGHT` / `USER_PALETTE_DARK`).
  Same hue, **deeper on paper → lighter on the dark card** (e.g. teal `#327379` → `#61AAB0`). Every
  value is verified **≥5:1** on its own surface (light set ~5.1–5.4:1 on paper; dark set ~6.4–6.9:1
  on the dark card) — well over the 4:1 floor Lily set, in *either* mode. `userColor()` reads
  `data-theme` and the theme toggle re-renders, so markers/dots/map re-resolve on switch.
  `--user-a`/`--user-b` mirror index 0/1 per theme. Hues **interleaved** so consecutive observers
  are distinct — A **teal** vs B **terracotta** are near-opposite (this "pushed out" the old olive B,
  which read too close to teal A). Calm/muted, **no chartreuse or neon**.
- Card body reorder + `em`/italic binomials + openModal-on-click all preserved.

## 6. **Search bar** redesign

Current iNat Lab search is a bare input in a `.pill` (`iNatLab:` header `#q`) — Lily: "it is ugly."

**Study — QM `.hdr-search`** (CSS 35–43, HTML 413): a search **icon `⌕` on the left**, the input,
and a **clear `✕` on the right** that appears only when there's a query/filters, plus a subtle
**"resolving" spinner** state on the icon while a smart lookup runs. Semantic `role="search"` +
`aria-label`.

**iNat Lab adaptation:** rebuild `#q`'s wrapper to this pattern, styled for the **Gallery light
theme** (hairline border, ink text, `⌕`/`✕` as inline line-SVGs — no emoji), keyboard-clearable,
44px touch target on the clear button. Wire the clear to reset query (and optionally filters, like
QM's `searchRst`).

## 7. **Heaviest caching / offline** (service worker)

Lily wants images + data cached for **offline use and hyperfast repeat exploration**.

**Study — QM `sw.js`** (cache-first static; stale-while-revalidate API 1h; cache-first images 24h;
LRU eviction; versioned caches; **propagates real failures — never a synthetic 503**).

**Port for iNat Lab (new `sw.js`, register it from `index.html`):**
- **Static (cache-first, versioned):** unpkg (Leaflet/esri-leaflet), `fonts.googleapis.com`,
  `fonts.gstatic.com`. Precache on install.
- **API (stale-while-revalidate, ~1h):** `api.inaturalist.org/v1/*`, `api.gbif.org/v1/*`,
  `en.wikipedia.org/w/api` + `/api`.
- **Images (cache-first, ~24h, LRU):** `*.inaturalist.org` / `inaturalist-open-data.s3*` photos,
  `upload.wikimedia.org`, and map tiles (`tile.openstreetmap.org`, `tile.opentopomap.org`, Esri).
- Bump `inatlab-*-vN` cache names on SW change; `skipWaiting`/`clients.claim`; **let genuine
  network/CORS failures propagate** (do not fabricate responses).
- Complement with the existing **in-page caches** (vernacular/image promise caches) for instant
  re-renders within a session. Consider a small "cached for offline" indicator.
- **Note:** a service worker needs http(s) (works on GitHub Pages + `localhost`, not `file://`).

### 7a. Eager cache-warming on import (Decision — Lily)

> "Cache as much as possible on CSV or API import, so the dataset can be fully explored quickly
> when online and even offline."

On a successful CSV load or API top-up, kick off a **background warm-up pass** that pre-fetches and
caches everything needed to explore the set offline — but do it **responsibly**, or a big import
would fire thousands of requests and get throttled/blocked (this is the one real tension with the
house rule "never burst hundreds of requests"):

- **Dedupe to unique taxa, not records.** A 5,000-record CSV is usually a few hundred unique
  species/genera/families. Pre-fetch **one representative record photo per taxon** (the tile's
  `r._img`) and **one vernacular / Wikipedia summary per taxon** — so the work scales with
  *distinct taxa*, not record count. Warm the ranks the UI actually shows (species + the Browse ranks).
- **Throttle:** a bounded concurrency queue (~4–6 in flight) with backoff; run in the background
  (`requestIdleCallback`) so the first render stays instant. Persist results through the SW image
  (24h) and API (1h→consider longer for taxon data) caches + the in-page promise caches.
- **Progress + honesty:** a small non-blocking "Preparing NNN taxa for offline… 62%" indicator;
  never block interaction; if the network drops mid-warm, cache what succeeded and show honest
  partial state. Make it **cancellable**, and skip re-warming taxa already cached.
- **Very large sets:** if unique taxa exceed a sane cap (say a few thousand), warm the visible/most
  common first and continue lazily on scroll rather than pre-fetching everything at once.
- The **service worker** (above) is what makes the warmed data survive a reload / offline session;
  the import warm-up is what *populates* it up-front. They work together.

---

## Suggested sequencing

1. **Browse (§1)** + **Records⇄Browse hop (§3)** together — the headline interaction.
2. **Records card redesign (§4)** — depends on the hop.
3. **Taxa alignment (§2)** — smaller, reuses the hop.
4. **Search redesign (§6)** — independent, quick win. *(Done.)*
5. **Service worker / caching (§7)** — last, once the fetch surface is stable, so cache rules match
   the real endpoints.

Then resume the original roadmap where not superseded: **map by taxonomic rank (Phase 2)**,
**species deep-dive (Phase 3)**, **spatial context layers (Phase 4)**, **public-app polish +
shareable URL state + a11y/mobile/perf + publish (Phase 5)**.

## Decisions (Lily, 2026-07-03) — resolved

1. **Browse rank pills:** Order / Superfamily / Family / Genus — **no Species pill**. "One of each
   species" stays as the **per-focus toggle** only (§1).
2. **Records card trail:** clicking a rank **hops to Browse** (sets filter + focuses the
   one-of-each-species plate), so back-to-Records shows all of that taxon (§3).
3. **Offline scope:** **eager warm-up on import** — cache as much as possible when a CSV/API set is
   loaded, deduped to unique taxa and throttled, so the whole set is explorable online *and*
   offline (§7a). Not merely organic/as-viewed.
4. **Tile images:** use **our own record photos only** (`r._img`), with an honest placeholder when a
   taxon has no photographed record. No multi-source image resolution — the loaded records carry the
   images (§1).
5. **Records card (§4):** username text **removed**; observer conveyed only by a **colour-coded ⌖
   marker** before the locality (name kept as `title`/`aria-label`). **No pin icon.** **Taxonomic
   order removed from the card entirely** — this **reverses** the earlier "Order added to the
   clickable trail" note; Order appears nowhere on the card. Trail contrast raised to `--muted`.
6. **Observer colours — theme-aware 12-hue calm palette** (`USER_PALETTE_LIGHT`/`_DARK`). Each hue
   has a deep light-mode variant (on paper) and a lighter dark-mode variant (on the dark card);
   **all ≥5:1** on their own surface (Lily's floor was 4:1, "solid, either mode"). `userColor()`
   picks by `data-theme`; the toggle re-renders. Hues interleaved for **observer distinctness**
   (A teal / B terracotta / C slate-violet …) — this replaced the earlier 4-colour earthy set where
   A (teal) and B (olive) were too close ("push out olive"). **Calm — no chartreuse/neon** (Lily,
   "not just yet"). Marker glyph = **inline SVG crosshair** with a real `stroke-width` (a Unicode
   `⌖` can't be reliably bolded). Generator kept at `/tmp` (HSL→WCAG-luminance search); if the hue
   set is ever regenerated, keep the ≥5:1 verification.
