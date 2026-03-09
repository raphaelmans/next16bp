import { runCuratedCourtImportCli } from "@/lib/modules/automations/curated-ingestion/services/curated-court-import.service";

runCuratedCourtImportCli(process.argv.slice(2))
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
