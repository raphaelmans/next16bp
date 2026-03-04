# Firecrawl Guide: Scrape Pickleball Courts (Curated Listings)

This guide outlines how to scrape pickleball court listings with Firecrawl and format the results for the curated courts CSV import.

## Prerequisites

- Firecrawl API key (`FIRECRAWL_API_KEY`).
- Node.js script access (recommended) or cURL.
- `pnpm db:seed:sports` already run so sport slugs exist.

## Output Format (CSV)

Target CSV columns (matches `scripts/templates/curated-courts-template.csv`):

`name,address,city,province,country,time_zone,latitude,longitude,facebook_url,instagram_url,viber_contact,website_url,other_contact_info,amenities,courts,photo_urls`

Formatting rules:

- `amenities`: semicolon-separated list (e.g., `Parking;Restrooms;Lights`).
- `photo_urls`: comma-separated URLs.
- `courts`: semicolon-separated court units; each unit uses `|` parts:
  - `sport_slug`
  - `sport_slug|tier_label`
  - `label|sport_slug|tier_label`
  - If label omitted, it will be auto-generated as `Court 1`, `Court 2`, etc.

## Recommended Extraction Schema

Use a structured schema to extract the fields you need. If a field is missing, return `null` (or empty string for CSV).

```json
{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "address": { "type": "string" },
    "city": { "type": "string" },
    "province": { "type": "string" },
    "country": { "type": "string" },
    "time_zone": { "type": "string" },
    "latitude": { "type": "string" },
    "longitude": { "type": "string" },
    "facebook_url": { "type": "string" },
    "instagram_url": { "type": "string" },
    "viber_contact": { "type": "string" },
    "website_url": { "type": "string" },
    "other_contact_info": { "type": "string" },
    "amenities": { "type": "array", "items": { "type": "string" } },
    "courts": { "type": "array", "items": { "type": "string" } },
    "photo_urls": { "type": "array", "items": { "type": "string" } },
    "source_url": { "type": "string" }
  },
  "required": ["name", "address", "city"]
}
```

## Firecrawl Prompt (Copy/Paste)

Use this prompt in the Firecrawl `formats`/`extract` request:

```
You are extracting pickleball court listings for a curated venue database.

Return a JSON object with:
- name, address, city, province, country, time_zone
- latitude, longitude (string or null)
- website_url, facebook_url, instagram_url, viber_contact, other_contact_info
- amenities as a list of short labels
- courts as an array of court unit strings using:
  - sport_slug
  - sport_slug|tier_label
  - label|sport_slug|tier_label
  If sport is not specified, use sport_slug "pickleball".
- photo_urls as a list of image URLs
- source_url (the page URL)

If data is missing, return null. Do not hallucinate.
```

## Firecrawl: Batch Scrape (Node.js)

Example using Firecrawl’s Node SDK `batchScrape` (per Firecrawl docs):

```ts
import Firecrawl from "@mendable/firecrawl-js";

const firecrawl = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY! });

const schema = {
  type: "object",
  properties: {
    name: { type: "string" },
    address: { type: "string" },
    city: { type: "string" },
    province: { type: "string" },
    country: { type: "string" },
    time_zone: { type: "string" },
    latitude: { type: "string" },
    longitude: { type: "string" },
    facebook_url: { type: "string" },
    instagram_url: { type: "string" },
    viber_contact: { type: "string" },
    website_url: { type: "string" },
    other_contact_info: { type: "string" },
    amenities: { type: "array", items: { type: "string" } },
    courts: { type: "array", items: { type: "string" } },
    photo_urls: { type: "array", items: { type: "string" } },
    source_url: { type: "string" }
  },
  required: ["name", "address", "city"]
};

const result = await firecrawl.batchScrape(
  [
    "https://example.com/courts/makati",
    "https://example.com/courts/bgccenter"
  ],
  {
    formats: [
      {
        type: "json",
        prompt: "Extract pickleball court listing details.",
        schema
      }
    ]
  }
);

console.log(result);
```

## Firecrawl: Extract via cURL

```bash
curl -s -X POST "https://api.firecrawl.dev/v2/extract" \
  -H "Authorization: Bearer $FIRECRAWL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "urls": ["https://example.com/courts/makati"],
    "prompt": "Extract pickleball court listing details.",
    "schema": {
      "type": "object",
      "properties": {
        "name": {"type": "string"},
        "address": {"type": "string"},
        "city": {"type": "string"},
        "amenities": {"type": "array", "items": {"type": "string"}},
        "courts": {"type": "array", "items": {"type": "string"}},
        "photo_urls": {"type": "array", "items": {"type": "string"}}
      },
      "required": ["name", "address", "city"]
    }
  }'
```

## Repo Pipeline: Crawl -> Raw -> AI Normalize -> Seed

This repo supports a staged pipeline:

1. Crawl pages and emit raw artifact only
2. Normalize with AI structured output into canonical PH city/province names
3. Seed normalized CSV into DB

### Stage 1: Crawl to Raw

Use `scripts/firecrawl-curated-courts.ts` in crawl-only mode:

```bash
pnpm scrape:curated:crawl -- --start-url https://app.sports360.ph/ --raw-output scripts/output/sports360-curated-courts.raw.json --state scripts/output/sports360-scrape-state.json --coverage-output scripts/output/sports360-coverage.json --rescrape-all

pnpm scrape:curated:crawl -- --start-url https://www.pickleheads.com/courts/ph --raw-output scripts/output/pickleheads-curated-courts.raw.json --state scripts/output/pickleheads-scrape-state.json --coverage-output scripts/output/pickleheads-coverage.json --rescrape-all
```

`--crawl-only` mode is baked into `pnpm scrape:curated:crawl` and writes:

- `*.raw.json` with `rawRecords` payload for normalization
- state + coverage artifacts

### Stage 2: Normalize Raw with AI Structured Output

Use `scripts/normalize-curated-courts-ai.ts`:

```bash
pnpm scrape:curated:normalize -- --input scripts/output/sports360-curated-courts.raw.json --model gpt-5-mini
pnpm scrape:curated:normalize -- --input scripts/output/pickleheads-curated-courts.raw.json --model gpt-5-mini
```

Outputs:

- `*.normalized.csv` (import-ready, canonical PH location names)
- `*.unresolved.csv` (rows AI could not confidently canonicalize)
- `*.normalize-report.json` (stats + unresolved reasons + duplicates)

Important flags:

- `--model <model>`: default `gpt-5-mini`
- `--ph-locations-file <path>`: default `public/assets/files/ph-provinces-cities.enriched.json`
- `--batch-size <n>`: batch size for AI normalization
- `--dry-run`: preview without writing files

### Stage 3: Reset Curated Staging + Seed

Reset curated staging data (safe preserve slug default):

```bash
pnpm db:reset:curated-staging -- --dry-run
pnpm db:reset:curated-staging -- --confirm --preserve-slug kudos-courts-complex
```

Then import normalized CSV:

```bash
pnpm db:import:curated-courts -- --file scripts/output/sports360-curated-courts.normalized.csv --dry-run
pnpm db:import:curated-courts -- --file scripts/output/sports360-curated-courts.normalized.csv
```

## Tips

- Keep unresolved rows out of import; review `*.unresolved.csv` first.
- Normalized CSV is the only file that should be seeded (`*.normalized.csv`).
- Re-runs are idempotent in normalize stage via source URL + fallback row key dedupe.
- Run `pnpm db:reset:curated-staging -- --dry-run` before any destructive reset.
