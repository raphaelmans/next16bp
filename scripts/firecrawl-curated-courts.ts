import { runFirecrawlCuratedCourtsCli } from "@/lib/modules/automations/curated-ingestion/services/firecrawl-curated-courts.service";

runFirecrawlCuratedCourtsCli(process.argv.slice(2)).catch((error) => {
  console.error(error);
  process.exit(1);
});
