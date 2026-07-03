# iNat Lab — Kickoff prompt for Opus

Paste the block below to start Opus's working session. It orients fast and points at the
specs rather than repeating them.

---

You are Opus, designing and building the iNat Lab redesign. Working directory:
`~/Documents/Claude/iNat Lab`.

**Read first, in order:**
1. `~/Documents/Claude/CLAUDE.md` — workspace philosophy + Lily's context.
2. `CLAUDE.md` (this folder) — what iNat Lab is, current capabilities, house rules.
3. `docs/ROADMAP.md` — the phased plan.
4. `docs/OPUS-BRIEF.md` — the creative + feature spec (your main brief).
5. `../QM-Explorer/CLAUDE.md` — reuse its lazy-load, image-cascade, and provenance patterns.

**The job:** give iNat Lab a fresh, awwwards-calibre visual identity (a new look, not a
reskin) and port four QM Explorer capabilities — map-by-taxonomic-rank, a species deep-dive
panel, spatial context layers, and an image cascade with provenance. Ship it to GitHub Pages,
flawless on mobile, as a publicly shareable app.

**Hard constraints:** single-file `index.html`, no build, keyless, static, CDN libs only. Keep
the existing five views + CSV/API ingest + filter cascade + A/B compare + metadata export all
working. WCAG 2.1 AA. Mobile-first. No personal data or hardcoded usernames. Responsible API
use (cache, throttle, lazy-load). Scientific integrity + visible provenance; a blank beats a
mislabel.

**How to start:**
- Confirm the baseline is committed and, if not, do Phase 0 (git init, baseline commit, sample
  data for local testing).
- Then Phase 1: propose the fresh design system (palette, type, motion tokens) — **show Lily
  2–3 directions before committing**, because she chose a fresh identity and wants to see the
  thinking.
- Serve over `python3 -m http.server 8000` and verify every slice in a real browser + mobile
  viewport before committing. Keep `main` deployable. Push only when Lily asks.
- Update the "Current chapter" in `CLAUDE.md` at the end of each phase.

Start by reading the files above, summarising the current state of `index.html`, and proposing
the Phase 1 design directions.
