# iNat Lab

A single-file, no-build web app for exploring **iNaturalist** records — loaded from a CSV
export or pulled live from the iNaturalist API — and running an imaging / metadata workflow
over them. It lets you interrogate a species and a record set more smoothly and cleanly than
iNaturalist itself: filter down a full taxonomic cascade, compare observers, map observations,
and generate image titles and keywords.

**Live:** https://lily-lmk.github.io/iNat-Lab/

## Run it locally

There's no build step. Serve the folder over HTTP (not `file://`, so `fetch`/CORS work):

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Then either **Load new…** to open an iNaturalist CSV export, or use the **Add records** panel
to pull records live by username and/or project.

## What it does

- **Ingest** — iNaturalist CSV export, or live API top-up by username(s) / project.
- **Filter** — kingdom → phylum → class → order → superfamily → family → subfamily → tribe →
  genus → species, plus user, quality grade, date range, and free-text search. Active filters
  show as a chip bar you can clear individually or all at once.
- **Views** — Records, Taxa, Field Guide, Dates, Map.
- **Compare** — two observers side by side (A/B colour coding).
- **Metadata** — generate an image **title** and **keywords** for any record (copy to
  clipboard); reconcile taxonomy against iNaturalist ("Update taxa").
- **Map** — Leaflet basemaps (OSM / topo / satellite / Esri topo / geology, with geology
  click-to-identify); observation points coloured **by taxonomic rank or by observer**, with a
  live legend.
- **Offline** — a service worker caches the app shell and, on import, warms a per-taxon image
  cache so a loaded set stays explorable offline. Your data is never cached to the repo — only
  the app shell and your own session's fetched media.

## Data sources

- **iNaturalist** — records (CSV or API), taxonomy, common names, links.
- **Wikipedia** — species descriptions and images (species deep-dive, planned).
- **Public spatial services** — bioregions (IBRA/IMCRA), LGAs, geology, elevation (planned).

All sources are public and keyless. The app bundles **no data and no API keys**; everything
loads at runtime.

## Architecture

- `index.html` — the whole app: HTML + CSS + JS inline, no framework, no build.
- `sw.js` — the offline service worker (app-shell + media caching).
- External deps via CDN: Inter (Google Fonts), Leaflet 1.9.4, esri-leaflet 3.0.12.
- Deploys as a static site (GitHub Pages).

The visual identity is "Gallery": a light-default, editorial, photographer-portfolio aesthetic
(one typeface, hairline/monochrome UI so the photographs are the colour) with an opt-in dark
theme.

## Privacy

iNat Lab is intended to be publicly shareable. It contains no personal defaults and never
commits your observation exports — `.gitignore` blocks `*.csv` / `*.numbers`. Your data stays
in your browser session.

## License & attribution

TBD (add before wider publishing). Respect the licences of iNaturalist, Wikipedia, and the
spatial services; surface attribution in the UI for every displayed image and enriched value.
