# iNat Lab — Next session plan

Written 2026-07-04, after the Records-card redesign + theme-aware observer palette landed
(commit `0cecaf4` on `main`, not pushed). Two behaviour problems come **first** (they affect
everyone using the app); the visual-polish items follow.

---

## 1. Mid-width layout collapse — **core bug FIXED 2026-07-04** (single swap at 680px)

**Done:** the sidebar is now only ever a **left column** (desktop) or an **off-canvas drawer**
(phone), swapping at one breakpoint — **680px ≈ 45% of a MacBook Pro 14"** — in both the CSS
(`@media 680`) and the JS (`_mqMobile = matchMedia(680)`). Removed the `aside{ order:2 }`
stacked-under state (was `@media 980`) and moved the drawer up from 820 → 680. The records grid
is `repeat(auto-fill, minmax(160px,1fr))`, so the narrower desktop content column just shows
fewer cards — no cramping. **Also** narrowed the sidebar to `minmax(230px,280px)` in the tight
681–780px band (`@media 780`) so it never grows wider than the records column. Verified live with
`0218-backyards-project.csv`: **900px** and **700px** = sidebar-left side-by-side (700 now reads
`280px 378px`, content > sidebar); **620px** = off-canvas drawer, content full-width. **No
stacked-under at any width.**

**Remaining polish (optional, next session):**
- **Resize-transition flash:** dragging the window *across* 680 briefly animates the drawer
  sliding out (transform transition on the media-query flip). Fine on load; only a drag artifact.
  Fix: don't transition `transform` on the mode switch — only when the drawer is opened/closed.
- **Consolidate the leftover component breakpoints** (900/700/620/560/520) that still tweak
  density piecemeal, so everything keys off the one phone breakpoint.
- **Confirm 680 against Lily's real windows** — if desktop feels tight in 680–820, nudge the swap
  up; the value lives in exactly two places (the CSS `@media` + `_mqMobile`).

---

### Original notes (kept for context)

**Symptom (Lily):** the app is good full-screen on the Mac and good on iPhone, but at ~**50%
of the laptop screen** the design *collapses* — it's a broken hybrid, neither desktop nor
phone. It should be **one or the other**.

**Decision (Lily):** below a set point — **under ~45% of a MacBook Pro 14" width** — swap to the
**phone behaviour mode**. Above it, hold the desktop layout.

**The math.** MBP 14" default logical width = **1512px**. So:
- 45% ≈ **680px** → the intended phone-mode breakpoint.
- 50% ≈ 756px (the width where it currently collapses — it's *above* 680, so it should be
  *desktop* mode there, just narrower).
- (A browser window at "50% of screen" gives a viewport a bit under half the logical width
  after window chrome, so treat 680px as a starting value and tune against the real window.)

**Root cause.** The phone transformations are **scattered across many breakpoints** instead of
firing together, so the mid zone is half-transformed:

| breakpoint | roughly what it changes (audit each) |
|---|---|
| `820px` | off-canvas **filters drawer** (`iNatLab:1643`) |
| `980px` | sidebar / main-grid layout (`:975`, `:1112`, `:1235`) |
| `900px` | recent-grid, stat blocks (`:1344`, `:1485`) |
| `700 / 620 / 600 / 560 / 520px` | assorted card/onboard/chip tweaks |

Between 680 and 980 you get the desktop drawer-not-yet-off-canvas **and** a reflowed grid at
the same time → the collapse.

**Plan.**
1. **Define one phone breakpoint** (start `~680px`; a single `--bp-phone` value / one `@media`).
   Above it = desktop behaviour; below it = the full phone treatment (off-canvas drawer,
   single-column content, compact header — everything that today fires at 820/980/etc.).
2. **Consolidate:** move the drawer (820), the grid/sidebar swap (980) and the other layout
   swaps to fire **together** at the phone breakpoint. Keep only *content-density* tweaks (font,
   tile min-width) as smaller intermediate steps if they genuinely help — but no *layout-mode*
   change except at the one point.
3. **Make the desktop layout hold cleanly from the breakpoint up to full.** Open design question
   to resolve first: **can the desktop sidebar + content sit comfortably at ~680px?** If not,
   either (a) let the sidebar narrow/contents reflow down to 680, or (b) raise the swap point to
   where desktop is still comfortable (e.g. 760–820) — confirm with Lily against her real window
   sizes. Her stated target is 45% (~680); verify it looks right there before locking it.
4. **Verify** by resizing the preview through 1512 → 900 → 760 → 680 → 620 → 390 and confirming a
   clean binary flip at the breakpoint (no hybrid), light + dark.

---

## 2. Field Guide scroll bug — **bounces back to top** — DIAGNOSED (2026-07-04)

**Symptom (Lily):** in Field Guide, scrolling *down* the species keeps snapping the view back to
the top.

**Investigated live** with `0218-backyards-project.csv` (Lepidoptera → 2,394 records → hundreds of
species tiles). **It is not a JS bug** — ruled out with evidence:
- No `scroll` listener / `IntersectionObserver` / `ResizeObserver` / `setInterval` / `rAF`.
- `render()` (from `#childMore` "Load more" `:3683` and the segmented toggle `:3673`) **preserves**
  scroll — tested: scrolled to the bottom, clicked Load more, `#view.scrollTop` held (content grows,
  so the position stays valid).
- Child-tile `.thumb` reserves height (`aspect-ratio:4/3`, `:1022`) — **no** lazy-image reflow.
- Direct `#view.scrollTop` manipulation is perfectly healthy (`6000→6000`, clamps at max `11020`),
  and there's **no nested scroller** inside `#view`.

**Root cause — nested scroll containers + no `overscroll-behavior`.** Every view scrolls an **inner
pane**: `#view.content { overflow:auto; min-height:0 }` (`:364`) at a fixed flex height, nested
inside `body { overflow:auto }`. Two scroll containers, and `overscroll-behavior` was set **nowhere**.
On a **macOS trackpad** this is the classic overscroll **rubber-band / scroll-chaining** setup — at a
momentum edge the pane snaps (or chains to the phantom body scroller), reading as "bounce to top." It
does **not** reproduce under CDP synthetic scroll (no trackpad momentum), which is consistent with a
real-input overscroll issue rather than a code path — so **final confirmation must be on Lily's Mac.**

**Fix:**
1. **Mitigation — APPLIED, uncommitted (test on the trackpad):** `overscroll-behavior: contain` on
   `.content` (`#view`), `iNatLab:364`. Stops the chaining/rubber-band propagation.
2. **Proper fix (recommended):** collapse to a **single scroll container** — let the window scroll the
   whole app (drop `#view`'s fixed-height inner `overflow`). Removes the nested-scroll bug class *and*
   **de-risks §1** — an app-shell of fixed panes is exactly what makes fluid mid-width resizing hard,
   so do this **with** the responsive rework.
3. **Insurance:** if any inner scroll remains, preserve/restore `#view.scrollTop` around `render()`.

Verify by scrolling a long species plate on a real trackpad, light + dark.

---

## 3. Visual polish (after 1 & 2)

Smaller, independent look items — do in any order once behaviour is solid:

- **Research-grade underline.** Today an `rg` card gets a green bottom-border
  (`.gallery … .rg` / `border-bottom`). Revisit its weight/colour/placement so it reads as an
  intentional "research grade" cue, not a stray rule — and works in both themes.
- **Name / date typography.** Scientific name vs common name vs date hierarchy on the card —
  size, weight, italics, spacing. Make the scientific name the clear anchor.
- **Tile spacing.** Grid gaps, card padding, thumb-to-text rhythm across the gallery + Guide
  tiles; consistency between Records and Field Guide.
- **Image framing.** How photos sit in the thumb (`object-fit`, aspect-ratio, radius, any inset)
  and how the placeholder matches; full-bleed vs framed.

---

## 4. UI cleanups from Lily's annotated review (2026-07-04)

Batched from an annotated screenshot pass. Most are small removals / consistency fixes; the Taxa
tree is a proper redesign. Line numbers are approximate (`iNatLab:`).

**Active-filters chip bar (`renderFilterChips`, `.chip-bar` / `#chipBar`, CSS `:162`):**
- **Overflow → wrap onto a second line.** The bar is `display:flex; overflow-x:auto` (`:162–168`),
  so a long taxon breadcrumb (e.g. `Lepidoptera › Noctuoidea › Erebidae › Boletobiinae › …`) runs
  off the right edge / scrolls instead of showing. It should **wrap** (`flex-wrap:wrap`, drop
  `overflow-x:auto`). Lily's reference for the wrapping is **QM Explorer's** chip bar (labelled
  pills over two rows). Separate open question: keep the current `value › value` breadcrumb style
  or move to QM-style labelled pills — she showed the pills, but the explicit ask is just wrapping.

**Field Guide focus view (`renderGuide` focus branch):**
- **Remove the duplicate breadcrumb.** The focus header renders a second crumb —
  `<nav class="crumbs" aria-label="Taxonomic path">` (`:3466`), "Guide › Lepidoptera › …" — which
  duplicates the top chip bar. **Delete it.** (Distinct from the index-only `.guideCrumb` blurb at
  `:3296`, which is covered next.)
- **Unify the header button styling** (`.guideActions`, `:3506`). "Records view" is a filled pill
  (`class="primary"` `:3507`), "Tribe/…​ index" is a bordered box with a return-arrow icon + blue
  text, "View on iNaturalist" (`:3510`) is a plain box. Three different treatments — make them one.
- **"One of each species" appears twice** — the segmented toggle button *and* the section heading
  `sectionLabel = "Species — one of each"` (`:3624`, rendered `:3641`). Drop the redundant heading
  wording (keep the count).

**Taxa view (`renderTaxa`, `:3987+`):**
- **Remove the explainer text** — "This tree is built from the *currently filtered* records… unfolding
  lens…" (`note.innerHTML`, `:4510`). Not needed.
- **Remove the per-row "Filter" button** (`.treeFilterBtn`, `:4130` and `:4439`) from every node.
  **Confirmed (Lily):** the taxon **name/row itself becomes the click target that filters Records**
  to that taxon — no separate Filter button. This **supersedes** HANDOFF §2's explicit two-action
  Filter button (Filter is now the row click); the **Guide** action (→ Field Guide focus) still
  needs a home in the redesigned node — decide its affordance during the Taxa rework.
- **Redesign the whole Taxa tree UX/aesthetic** (larger). "Everything is in a pillbox"; the nodes
  and their Filter/Guide/GBIF actions are all pill-shaped and the module "could be greatly improved."
  Treat as its own slice and **fold with HANDOFF §2** (align Taxa to QM: lazy tree, auto-expand to
  the active path, two-action model, and a cleaner visual language — not pillboxes).

---

## Not in scope / already settled
- Image tiles use **our own record photos only** (no multi-source cascade). §5 removed.
- Observer palette is the **12-hue theme-aware calm set** (`USER_PALETTE_LIGHT/_DARK`); marker is
  the **inline SVG crosshair**. Don't reintroduce olive at A/B. "No chartreuse — *not just yet*."
- Records card §4 is **done**; remaining HANDOFF items are §2 Taxa and §7 service worker.
