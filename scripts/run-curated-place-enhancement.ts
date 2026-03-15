import { runCuratedPlaceEnhancementCli } from "@/lib/modules/automations/curated-ingestion/services/curated-place-enhancement-runner.service";

runCuratedPlaceEnhancementCli(process.argv.slice(2))
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
