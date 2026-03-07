/**
 * Test script for geocode service iteration.
 *
 * Edit the values below and run:
 *   pnpm script:test-geocode
 */

// ── Edit these ──────────────────────────────────
const ADDRESS = "magnum sports complex";
const CITY = "CEBU CITY";
const PROVINCE = "CEBU";
// ────────────────────────────────────────────────

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

if (!GOOGLE_MAPS_API_KEY) {
  console.error("Missing GOOGLE_MAPS_API_KEY");
  process.exit(1);
}

async function textSearch(address: string, city?: string, province?: string) {
  const parts = [address, city, province].filter(Boolean);
  const textQuery = parts.join(", ");

  console.log(`\nQuery: "${textQuery}"`);
  console.log("---");

  const response = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY!,
        "X-Goog-FieldMask":
          "places.displayName,places.formattedAddress,places.location,places.id,places.types",
      },
      body: JSON.stringify({ textQuery }),
    },
  );

  const json = (await response.json()) as Record<string, unknown>;

  if (!response.ok) {
    console.log(`HTTP ${response.status}`);
    console.log(JSON.stringify(json, null, 2));
    return;
  }

  const places = (json.places as Array<Record<string, unknown>>) ?? [];
  console.log(`Found ${places.length} result(s):\n`);

  for (const [i, p] of places.entries()) {
    console.log(`  [${i + 1}]`);
    console.log(JSON.stringify(p, null, 4));
    console.log();
  }
}

async function main() {
  // Run with context
  await textSearch(ADDRESS, CITY, PROVINCE);

  // Also run without context for comparison
  if (CITY || PROVINCE) {
    console.log("\n\n=== Without city/province (current behavior) ===");
    await textSearch(ADDRESS);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
