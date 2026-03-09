import type { RunCuratedIngestionPipelineInput } from "../dtos/run-curated-ingestion-pipeline.dto";

interface RunCuratedIngestionPipelineDeps {
  runExtraction: (cliArgs?: string[]) => Promise<unknown>;
  runDuplicatePreflight: (cliArgs?: string[]) => Promise<unknown>;
  runImportApproved: (cliArgs?: string[]) => Promise<unknown>;
  runSeed: (cliArgs?: string[]) => Promise<unknown>;
  runEmbeddingBackfill: (cliArgs?: string[]) => Promise<unknown>;
}

export class RunCuratedIngestionPipelineUseCase {
  constructor(private readonly deps: RunCuratedIngestionPipelineDeps) {}

  async execute(input: RunCuratedIngestionPipelineInput) {
    await this.deps.runExtraction(input.extractArgs);

    if (input.runDuplicatePreflight !== false) {
      await this.deps.runDuplicatePreflight(input.duplicatePreflightArgs);
    }

    if (input.runSeed) {
      await this.deps.runSeed(input.seedArgs);
    }

    if (input.runImportApproved) {
      await this.deps.runImportApproved(input.importApprovedArgs);
    }

    if (input.runEmbeddingBackfill) {
      await this.deps.runEmbeddingBackfill(input.embeddingBackfillArgs);
    }
  }
}
