import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type CuratedIngestionStageStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "skipped";

export interface CuratedIngestionStageState {
  status: CuratedIngestionStageStatus;
  startedAt: string | null;
  finishedAt: string | null;
  lastError: string | null;
  notes: string | null;
}

export interface CuratedIngestionRunScopeState {
  provinceSlug: string;
  citySlug: string;
  provinceName: string;
  cityName: string;
  sportSlug: string;
}

export interface CuratedIngestionRunState {
  version: number;
  scopeKey: string;
  createdAt: string;
  updatedAt: string;
  scope: CuratedIngestionRunScopeState;
  importedPlaceIds: string[];
  stages: {
    discovery: CuratedIngestionStageState;
    scrape: CuratedIngestionStageState;
    duplicatePreflight: CuratedIngestionStageState;
    importApproved: CuratedIngestionStageState;
    facebookDiscovery: CuratedIngestionStageState;
    facebookCapture: CuratedIngestionStageState;
    facebookDuplicatePreflight: CuratedIngestionStageState;
    facebookImportApproved: CuratedIngestionStageState;
    dbVerification: CuratedIngestionStageState;
    embeddingBackfill: CuratedIngestionStageState;
  };
}

function createStageState(): CuratedIngestionStageState {
  return {
    status: "pending",
    startedAt: null,
    finishedAt: null,
    lastError: null,
    notes: null,
  };
}

function createDefaultState(
  scopeKey: string,
  scope: CuratedIngestionRunScopeState,
): CuratedIngestionRunState {
  const nowIso = new Date().toISOString();

  return {
    version: 1,
    scopeKey,
    createdAt: nowIso,
    updatedAt: nowIso,
    scope,
    importedPlaceIds: [],
    stages: {
      discovery: createStageState(),
      scrape: createStageState(),
      duplicatePreflight: createStageState(),
      importApproved: createStageState(),
      facebookDiscovery: createStageState(),
      facebookCapture: createStageState(),
      facebookDuplicatePreflight: createStageState(),
      facebookImportApproved: createStageState(),
      dbVerification: createStageState(),
      embeddingBackfill: createStageState(),
    },
  };
}

async function tryReadJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const content = await readFile(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

export class CuratedIngestionRunStateRepository {
  async load(
    statePath: string,
    scopeKey: string,
    scope: CuratedIngestionRunScopeState,
  ): Promise<CuratedIngestionRunState> {
    const fromDisk =
      await tryReadJsonFile<Partial<CuratedIngestionRunState>>(statePath);
    const fallback = createDefaultState(scopeKey, scope);

    if (!fromDisk || typeof fromDisk !== "object") {
      return fallback;
    }

    return {
      ...fallback,
      ...fromDisk,
      version: 1,
      scopeKey,
      updatedAt: new Date().toISOString(),
      scope,
      importedPlaceIds: Array.isArray(fromDisk.importedPlaceIds)
        ? fromDisk.importedPlaceIds.filter(
            (value): value is string => typeof value === "string",
          )
        : [],
      stages: {
        discovery: {
          ...fallback.stages.discovery,
          ...fromDisk.stages?.discovery,
        },
        scrape: { ...fallback.stages.scrape, ...fromDisk.stages?.scrape },
        duplicatePreflight: {
          ...fallback.stages.duplicatePreflight,
          ...fromDisk.stages?.duplicatePreflight,
        },
        importApproved: {
          ...fallback.stages.importApproved,
          ...fromDisk.stages?.importApproved,
        },
        facebookDiscovery: {
          ...fallback.stages.facebookDiscovery,
          ...fromDisk.stages?.facebookDiscovery,
        },
        facebookCapture: {
          ...fallback.stages.facebookCapture,
          ...fromDisk.stages?.facebookCapture,
        },
        facebookDuplicatePreflight: {
          ...fallback.stages.facebookDuplicatePreflight,
          ...fromDisk.stages?.facebookDuplicatePreflight,
        },
        facebookImportApproved: {
          ...fallback.stages.facebookImportApproved,
          ...fromDisk.stages?.facebookImportApproved,
        },
        dbVerification: {
          ...fallback.stages.dbVerification,
          ...fromDisk.stages?.dbVerification,
        },
        embeddingBackfill: {
          ...fallback.stages.embeddingBackfill,
          ...fromDisk.stages?.embeddingBackfill,
        },
      },
    };
  }

  async save(
    statePath: string,
    state: CuratedIngestionRunState,
  ): Promise<void> {
    const nextState: CuratedIngestionRunState = {
      ...state,
      updatedAt: new Date().toISOString(),
    };

    await mkdir(path.dirname(statePath), { recursive: true });
    await writeFile(
      statePath,
      `${JSON.stringify(nextState, null, 2)}\n`,
      "utf-8",
    );
  }
}
