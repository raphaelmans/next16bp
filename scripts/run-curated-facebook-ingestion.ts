import { runCuratedFacebookIngestionRunnerCli } from "@/lib/modules/automations/curated-ingestion/services/curated-facebook-ingestion-runner.service";

runCuratedFacebookIngestionRunnerCli(process.argv.slice(2))
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
