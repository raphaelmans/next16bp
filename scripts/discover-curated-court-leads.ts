import { runCuratedLeadDiscoveryCli } from "@/lib/modules/automations/curated-ingestion/services/curated-lead-discovery.service";

runCuratedLeadDiscoveryCli(process.argv.slice(2))
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
