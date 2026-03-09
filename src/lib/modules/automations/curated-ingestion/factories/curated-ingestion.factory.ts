import { runCuratedCourtImportCli } from "../services/curated-court-import.service";
import { runCuratedCourtSeedCli } from "../services/curated-court-seed.service";
import { runCuratedDuplicatePreflightCli } from "../services/curated-duplicate-preflight.service";
import { runFirecrawlCuratedCourtsCli } from "../services/firecrawl-curated-courts.service";
import { runPlaceEmbeddingBackfillCli } from "../services/place-embedding-backfill.service";
import { RunCuratedIngestionPipelineUseCase } from "../use-cases/run-curated-ingestion-pipeline.use-case";

let runCuratedIngestionPipelineUseCase: RunCuratedIngestionPipelineUseCase | null =
  null;

export function makeRunCuratedIngestionPipelineUseCase() {
  if (!runCuratedIngestionPipelineUseCase) {
    runCuratedIngestionPipelineUseCase = new RunCuratedIngestionPipelineUseCase(
      {
        runExtraction: runFirecrawlCuratedCourtsCli,
        runDuplicatePreflight: runCuratedDuplicatePreflightCli,
        runImportApproved: runCuratedCourtImportCli,
        runSeed: runCuratedCourtSeedCli,
        runEmbeddingBackfill: runPlaceEmbeddingBackfillCli,
      },
    );
  }

  return runCuratedIngestionPipelineUseCase;
}
