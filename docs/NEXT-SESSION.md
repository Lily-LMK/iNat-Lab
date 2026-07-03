# iNat Lab — Next session plan

Written 2026-07-04, after the Records-card redesign + theme-aware observer palette landed
(commit `0cecaf4` on `main`, not pushed). Two behaviour problems come **first** (they affect
everyone using the app); the visual-polish items follow.

---

## 1. Mid-width layout collapse — **top priority**

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

## 2. Field Guide scroll bug — **bounces back to top** — fix

**Symptom (Lily):** in Field Guide, scrolling *down* the species keeps snapping the view back to
the top.

**Static analysis so far (this session):** no `scroll` listener, no `IntersectionObserver` /
`ResizeObserver`, no `setInterval`, no `requestAnimationFrame` in the file. `renderGuide()` is
called only on tab-switch (`:3847`) and the "Load next 120" / `childMore` **click** handlers
(`:3420`, `:3681`) — not on scroll. So the cause isn't an obvious scroll-driven re-render; it's
likely a **layout / scroll-anchoring** effect or an unexpected re-render. Needs a **live repro
with a large dataset** (the sample CSV has too few species per taxon to scroll).

**Repro recipe (next session):** serve the folder, load a **large** CSV (Lily's git-ignored set),
go to Field Guide → focus a taxon with many species (or the "one of each species" plate), scroll.

**Prime suspects to instrument, in order:**
1. **Scroll-anchoring vs the sticky header.** `.…{position:sticky; top:0}` (`iNatLab:108`). As
   lazy `r._img` tiles load *below*, the browser's scroll anchoring can jump — test with
   `overflow-anchor:none` on the scroll container and/or reserving tile height.
2. **Lazy-image layout shift.** Confirm the Guide child-tile `.thumb` has a fixed `aspect-ratio`
   so images loading on scroll don't reflow (index tiles do — verify the focus/species plate
   tiles do too). Unreserved height + `scroll-behavior` can read as "bounce".
3. **An unexpected `renderGuide()` re-invocation.** Add a temporary `console.count` in
   `renderGuide` and watch whether it fires while scrolling; if so, trace the trigger.
4. **A stray `.focus()` pulling scroll** on re-render (`:3836` etc. are elsewhere, but re-check
   the Guide focus path).

Fix once the instrument identifies the cause; re-verify by scrolling a long species plate.

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

## Not in scope / already settled
- Image tiles use **our own record photos only** (no multi-source cascade). §5 removed.
- Observer palette is the **12-hue theme-aware calm set** (`USER_PALETTE_LIGHT/_DARK`); marker is
  the **inline SVG crosshair**. Don't reintroduce olive at A/B. "No chartreuse — *not just yet*."
- Records card §4 is **done**; remaining HANDOFF items are §2 Taxa and §7 service worker.
