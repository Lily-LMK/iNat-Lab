# iNat Lab

A single-file, no-build web app for exploring **iNaturalist** records — loaded from a CSV
export or pulled live from the iNaturalist API — and running an imaging / metadata workflow
over them. It lets you interrogate a species and a record set more smoothly and cleanly than
iNaturalist itself: filter down a full taxonomic cascade, compare users, map observations,
and generate titles, captions, keywords and enriched common names for your images.

> Status: **in redesign.** A fresh visual identity and four new capabilities (ported from
> the sibling project *QM Explorer*) are being built. See `docs/ROADMAP.md` and
> `docs/FABLE-BRIEF.md`.

## Run it locally

There's no build step. Serve the folder over HTTP (not `file://`, so `fetch`/CORS work):

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Then either **Open file…** to load an iNaturalist CSV export, or use the **API** panel to
pull records live by username and/or project.

## What it does

- **Ingest** — iNaturalist CSV export, or live API top-up by username(s) / project.
- **Filter** — kingdom → phylum → class → order → superfamily → family → subfamily → tribe →
  genus → species, plus user, quality grade, date range, and free-text search.
- **Views** — Records, Taxa, Field Guide, Dates, Map.
- **Compare** — two users side by side (A/B colour coding).
- **Metadata** — generate titles / captions / keywords; enrich missing common names (GBIF);
  reconcile taxonomy against iNaturalist ("Update taxa"); copy/export everything.
- **Map** — Leaflet basemaps (OSM / topo / satellite / geology) with GBIF density + points.

## Data sources

- **iNaturalist** — records (CSV or API), taxonomy, common names, links.
- **GBIF** — common-name enrichment, density layers.
- **Wikipedia** — species descriptions and images (deep-dive, planned).
- **Public spatial services** — bioregions (IBRA/IMCRA), LGAs, geology, elevation (planned).

All sources are public and keyless. The app bundles **no data and no API keys**; everything
loads at runtime.

## Architecture

- `index.html` — the whole app: HTML + CSS + JS inline, no framework, no build.
- External deps via CDN: Leaflet 1.9.4, esri-leaflet 3.0.12.
- Designed to deploy as a static site (GitHub Pages).

## Privacy

iNat Lab is intended to be publicly shareable. It contains no personal defaults and never
commits your observation exports — `.gitignore` blocks `*.csv` / `*.numbers`. Your data stays
in your browser session.

## License & attribution

TBD (add before publishing). Respect the licences of iNaturalist, GBIF, Wikipedia, and the
spatial services; surface attribution in the UI for every displayed image and enriched value.
