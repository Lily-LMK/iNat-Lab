#!/usr/bin/env node
/*
 * build-common-seed.mjs — regenerate the baked common-name seed for index.html.
 *
 * iNat Lab shows rank-appropriate common names (iNaturalist preferred_common_name)
 * in Records cards, the Field Guide, and the Taxa tree. Normally these are harvested
 * live during the taxon-photo warm-up. To make the datasets Lily loads most show
 * their names on the FIRST render — before, or entirely without, the live pass — a
 * seed harvested from those datasets is embedded in index.html as TAXON_COMMON_SEED.
 *
 * This script rebuilds that seed: it reads the unique taxon_ids from a CSV export,
 * fetches each taxon from the live iNat Taxa API (Australian English locale), harvests
 * common names for the taxon AND its ancestry, keeps only the ranks the app renders,
 * and prints a compact JSON object keyed "rank|lowername" -> common name.
 *
 * Only public taxonomy is fetched — no observation data is read beyond the taxon_id
 * column. Names iNat has none for are omitted (the app shows an honest blank).
 *
 * Usage:
 *   node tools/build-common-seed.mjs <export.csv> [out.json]
 *   node tools/build-common-seed.mjs observations-755169.csv seed.json
 *
 * Then embed the JSON into index.html as the value of `const TAXON_COMMON_SEED = …;`
 * (replace the existing literal). Merged at boot only where a key is absent, so the
 * durable cache and live warm-up (both fresher) always win.
 */
import { readFileSync, writeFileSync } from "node:fs";

const [, , csvPath, outPath] = process.argv;
if(!csvPath){
  console.error("usage: node tools/build-common-seed.mjs <export.csv> [out.json]");
  process.exit(1);
}

const LOCALE = "locale=en&preferred_place_id=6744"; // 6744 = Australia
const RENDER_RANKS = new Set([
  "kingdom","phylum","class","order","superfamily",
  "family","subfamily","tribe","genus","species"
]);
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Minimal quote-aware CSV parser (iNat exports quote fields containing commas).
function parseCSV(text){
  const rows = []; let f = [], cur = "", q = false;
  for(let i = 0; i < text.length; i++){
    const ch = text[i];
    if(q){ if(ch === '"'){ if(text[i+1] === '"'){ cur += '"'; i++; } else q = false; } else cur += ch; }
    else { if(ch === '"') q = true; else if(ch === ',') { f.push(cur); cur = ""; }
           else if(ch === '\n'){ f.push(cur); rows.push(f); f = []; cur = ""; }
           else if(ch === '\r'){} else cur += ch; }
  }
  if(cur.length || f.length){ f.push(cur); rows.push(f); }
  return rows;
}

const rows = parseCSV(readFileSync(csvPath, "utf8"));
const ti = rows[0].indexOf("taxon_id");
if(ti < 0){ console.error("no taxon_id column in CSV"); process.exit(1); }
const ids = [...new Set(rows.slice(1).map(r => (r[ti] || "").trim()).filter(Boolean))];
console.error(`unique taxon_ids: ${ids.length}`);

const seed = {};
const key = (rank, name) => `${rank.toLowerCase()}|${name.trim().toLowerCase()}`;
const put = t => {
  if(!t || !t.rank || !t.name) return;
  if(!RENDER_RANKS.has(String(t.rank).toLowerCase())) return;
  const cn = (t.preferred_common_name || "").trim();
  if(cn) seed[key(t.rank, t.name)] = cn;
};

const BATCH = 30; // iNat Taxa API accepts comma-separated ids
let done = 0, failed = 0;
for(let start = 0; start < ids.length; start += BATCH){
  const batch = ids.slice(start, start + BATCH);
  const url = `https://api.inaturalist.org/v1/taxa/${batch.join(",")}?per_page=${batch.length}&${LOCALE}`;
  try{
    const res = await fetch(url, { headers: { "User-Agent": "iNat-Lab seed builder (one-off)" } });
    if(res.status === 429){ console.error("429 — backing off 5s"); await sleep(5000); start -= BATCH; continue; }
    const data = await res.json();
    for(const t of (data.results || [])){
      put(t);
      if(Array.isArray(t.ancestors)) for(const a of t.ancestors) put(a);
    }
  }catch(e){ failed++; console.error("batch failed (will be filled by live warm-up):", e.message); }
  done += batch.length;
  if(start % (BATCH * 10) === 0) console.error(`  …${done}/${ids.length} (entries: ${Object.keys(seed).length})`);
  await sleep(700); // polite pacing, well under iNat's ~100/min
}

// Sort keys for a stable, diff-friendly literal.
const sorted = {};
for(const k of Object.keys(seed).sort()) sorted[k] = seed[k];
const json = JSON.stringify(sorted);

if(outPath){ writeFileSync(outPath, json); console.error(`wrote ${outPath}`); }
else process.stdout.write(json + "\n");

const hist = {};
for(const k of Object.keys(sorted)){ const r = k.split("|")[0]; hist[r] = (hist[r] || 0) + 1; }
console.error(`\nentries: ${Object.keys(sorted).length}, failed batches: ${failed}, ~${(json.length/1024).toFixed(0)} KB`);
console.error("by rank:", JSON.stringify(hist));
