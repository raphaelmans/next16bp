import { runCuratedFacebookPageCaptureCli } from "@/lib/modules/automations/curated-ingestion/services/curated-facebook-page-capture.service";

runCuratedFacebookPageCaptureCli(process.argv.slice(2))
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
