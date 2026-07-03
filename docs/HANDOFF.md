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
- **Images via the lazy cascade** — `resolveGroupImage(name,rank,opts)` (2404): cache-keyed,
  returns a guaranteed-displayable candidate, evicts placeholders/failures; filled lazily via an
  `IntersectionObserver` + generation counter + throttled queue (2417+). See §5 (image cascade).

**iNat Lab adaptation:** iNat Lab is CSV/iNat-API-driven, not ALA facets — group `app.filteredIdx`
by the chosen rank (the current `renderGuide` at `iNatLab:~2953` already does this). Keep the
**breadcrumb** and the **"one of each species"** toggle already built in Phase 1 — they fit QM's
model. What's missing vs QM: **image tiles in the index** (currently text cards), the **image
cascade**, and **URL state** (`pushURLState`). Rank pills should include Species (= one-of-each).

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

This is QM's dual behaviour combined: a **taxon-trail click sets the filter *and* focuses Browse**.
- QM Records cards carry a taxonomic trail of `.tax-link[data-rk][data-nm]` (1836); a delegated
  handler calls `applyTaxonFilter` (1862). QM Taxa nodes hop to Browse via `guideFocus + switchView`
  (2099).
- **For iNat Lab:** a trail-rank click should do **`setFilterSilent(rank,name)` + `guideFocus={rank,name}`
  + `switchView('guide')`** and render the **one-of-each-species** plate for that taxon. Because the
  filter is set, **switching to Records then shows *all* records of that taxon** — no extra work.
  Provide a clear "**View all N records**" affordance in the Browse focus (QM's `guideBack`/Records
  button, `iNatLab:` guide focus already has a "Records view" button — wire it to keep the filter).

## 4. Redesign the **Records** cards

**Card hierarchy (top → bottom), per Lily:** Image · **Scientific name** · Common name · Date ·
Place · **Taxonomic trail**.

- **Observer marker:** replace the map-pin-before-location with a coloured **⌖** (U+2316 POSITION
  INDICATOR) placed before the place text, coloured by the observer via `userColor(user)`
  (`iNatLab:~1894`). **No name** — the colour signifies the user. Keep the A/B azure/ochre for the
  compared pair; other users get their palette colour. Add a tooltip/`aria-label` with the username
  for accessibility (colour alone must not be the only signal — WCAG 1.4.1).
- **Trail** = order › (superfamily) › family › genus, each a `.tax-link` that triggers the §3 hop.
  Omit any rank that duplicates the scientific name (QM does this at 1834–1835).
- Reference QM card DOM: `renderGallery` (1822–1856) — `.card-th` / `.card-sci.it` / `.card-com` /
  `.card-fam` / `.card-det > .card-tax + .loc`. iNat Lab's current card is `iNatLab:renderRecords
  ~3540`; keep element IDs/behaviour (openModal on card click) while restructuring the body order.
- Scientific name **italic** (binomials) — Phase 1 already sets `em/.sci` italic.

## 5. Image cascade with provenance (feeds §1, §2, §4; = roadmap Phase 5)

Port QM's `resolveGroupImage` discipline (2404), adapted to iNaturalist sources:
- Cascade: **iNat default photo (taxon or record) → Wikipedia lead image → honest placeholder**
  (QM is museum-first; drop the ALA/QM steps). Preload each candidate, fall through on load error,
  cache the in-flight promise, **evict placeholders/failures** so a blip doesn't lock a tile.
- **Rank-appropriate** (a family tile shows a family representative, not a random species).
- **Lazy** via `IntersectionObserver` + a **bounded concurrency queue** (QM's `_guideImgObserver` +
  generation counter, 2417+) so a big rank doesn't storm the APIs.
- Every image carries **attribution + provenance** (iNat photo licence/attribution; Wikipedia/CC).
- Reuse across Browse tiles, Taxa, the species plate, and the species deep-dive.

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

---

## Suggested sequencing

1. **Image cascade (§5)** first — it feeds Browse, Taxa, cards, and the deep-dive. (Roadmap Phase 5.)
2. **Browse (§1)** + **Records⇄Browse hop (§3)** together — the headline interaction.
3. **Records card redesign (§4)** — depends on the cascade + the hop.
4. **Taxa alignment (§2)** — smaller, reuses the hop.
5. **Search redesign (§6)** — independent, quick win.
6. **Service worker / caching (§7)** — last, once the fetch surface is stable, so cache rules match
   the real endpoints.

Then resume the original roadmap where not superseded: **map by taxonomic rank (Phase 2)**,
**species deep-dive (Phase 3)**, **spatial context layers (Phase 4)**, **public-app polish +
shareable URL state + a11y/mobile/perf + publish (Phase 6)**.

## Open questions for Lily

- **Browse rank pills:** include Species (= the one-of-each plate) as a top-level pill, or keep it
  as the per-focus toggle only?
- **Trail click target:** should clicking a rank in a Records card hop to Browse (as in §3), or only
  the Taxa "Guide" action? (Assumed: the card trail hops, per your Noctuoidea example.)
- **Offline scope:** cache only what's been viewed (organic), or add an explicit "Download this set
  for offline" action that pre-fetches all images/data for the current filter?
