export interface RunCuratedIngestionPipelineInput {
  extractArgs?: string[];
  duplicatePreflightArgs?: string[];
  seedArgs?: string[];
  importApprovedArgs?: string[];
  embeddingBackfillArgs?: string[];
  runDuplicatePreflight?: boolean;
  runSeed?: boolean;
  runImportApproved?: boolean;
  runEmbeddingBackfill?: boolean;
}
