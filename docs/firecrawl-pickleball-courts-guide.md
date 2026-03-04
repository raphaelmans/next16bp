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

## Repo Script: Sports360 → Curated CSV

This repo includes `scripts/firecrawl-curated-courts.ts`, which:

1. Maps URLs from a start URL (`/v2/map`) or reads URLs from `--urls-file`
2. Expands discovery with Sports360 `storehubs` routes (`/sportshub/:name`)
3. Tracks URL/row inventory in a persistent state file
4. Extracts structured venue data (`/v2/extract`) only for new URLs by default
5. Writes import-ready CSV, extraction audit JSON, and migration coverage report

Run:

```bash
pnpm scrape:curated-courts
pnpm scrape:curated-courts -- --start-url https://app.sports360.ph/
pnpm scrape:curated-courts -- --dry-run
pnpm scrape:curated-courts -- --urls-file scripts/output/sports360-urls.txt
pnpm scrape:curated-courts -- --discover-only
pnpm scrape:curated-courts -- --rescrape-all
```

Outputs (default):

- `scripts/output/sports360-curated-courts.csv`
- `scripts/output/sports360-curated-courts.raw.json`
- `scripts/output/sports360-scrape-state.json`
- `scripts/output/sports360-coverage.json`

Important flags:

- `--discover-only`: map and update inventory, but skip extraction.
- `--rescrape-all`: ignore state and scrape URLs again.
- `--state <path>`: override scrape state file path.
- `--coverage-output <path>`: override coverage report path.
- `--skip-db-coverage`: skip DB lookup for migrated-vs-pending reporting.

Suggested brute-force workflow:

1. Discover only:
   `pnpm scrape:curated-courts -- --discover-only`
2. Scrape only new/unseen pages:
   `pnpm scrape:curated-courts`
3. Review pending migration backlog from coverage report:
   `scripts/output/sports360-coverage.json`
4. Import:
   `pnpm db:import:curated-courts -- --file scripts/output/sports360-curated-courts.csv --dry-run`
5. Import for real:
   `pnpm db:import:curated-courts -- --file scripts/output/sports360-curated-courts.csv`

## Post-Processing: Convert JSON → CSV

For each scraped item, map JSON fields into the CSV columns:

- `amenities`: join with `;`
- `courts`: join with `;`
- `photo_urls`: join with `,`
- `country`: default to `PH` if missing
- `time_zone`: default to `Asia/Manila` if missing

## Import into DB

```bash
pnpm db:seed:sports
pnpm db:import:curated-courts -- --file scripts/output/sports360-curated-courts.csv --dry-run
pnpm db:import:curated-courts -- --file scripts/output/sports360-curated-courts.csv
```

## Tips

- Normalize `city` to match your admin filter list (e.g., `BGC`, `Makati`).
- Avoid duplicate rows: importer dedupe is `name + city + province`.
- When unsure about `courts`, default to `pickleball|` and let labels auto-generate.
- Re-runs are idempotent at scrape level via canonical URL state; use `--rescrape-all` only when needed.
