import { runPlaceListingVerifierCli } from "@/lib/modules/automations/listing-verifier/cli";

runPlaceListingVerifierCli(process.argv.slice(2))
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
