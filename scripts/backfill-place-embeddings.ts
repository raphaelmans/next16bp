import { runPlaceEmbeddingBackfillCli } from "@/lib/modules/automations/curated-ingestion/services/place-embedding-backfill.service";

runPlaceEmbeddingBackfillCli(process.argv.slice(2))
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
