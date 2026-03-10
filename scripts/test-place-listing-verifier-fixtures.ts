import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { deriveDeterministicSuggestion } from "@/lib/modules/automations/listing-verifier/shared/place-listing-verifier.domain";
import { PlaceListingFixtureSchema } from "@/lib/modules/automations/listing-verifier/shared/place-listing-verifier.schemas";

const FIXTURE_DIR = path.resolve(
  process.cwd(),
  "scripts/fixtures/listing-verifier",
);

function main() {
  const files = readdirSync(FIXTURE_DIR)
    .filter((entry) => entry.endsWith(".json"))
    .sort();

  const mismatches: string[] = [];

  for (const file of files) {
    const raw = readFileSync(path.join(FIXTURE_DIR, file), "utf-8");
    const fixture = PlaceListingFixtureSchema.parse(JSON.parse(raw));

    for (const testCase of fixture.cases) {
      const suggestion = deriveDeterministicSuggestion(
        testCase.evidence.baselineFlags,
      );

      if (suggestion.label !== testCase.expected.label) {
        mismatches.push(
          `${fixture.fixtureName}:${testCase.evidence.placeId}: expected label ${testCase.expected.label}, got ${suggestion.label}`,
        );
      }

      if (suggestion.reasonCode !== testCase.expected.reasonCode) {
        mismatches.push(
          `${fixture.fixtureName}:${testCase.evidence.placeId}: expected reason ${testCase.expected.reasonCode}, got ${suggestion.reasonCode}`,
        );
      }
    }
  }

  if (mismatches.length > 0) {
    process.stderr.write(`${mismatches.join("\n")}\n`);
    process.exit(1);
  }

  process.stdout.write(
    `Verified ${files.length} listing-verifier fixture files deterministically.\n`,
  );
}

main();
