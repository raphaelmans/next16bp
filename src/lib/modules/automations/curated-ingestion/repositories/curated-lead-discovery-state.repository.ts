import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export interface LeadDiscoveryStateEntry {
  canonicalUrl: string;
  latestUrl: string;
  firstDiscoveredAt: string;
  lastDiscoveredAt: string;
  sourceQuery: string;
  title: string | null;
  snippet: string | null;
  domain: string | null;
  relevanceScore: number;
  handedOffToScrapeAt: string | null;
}

export interface LeadDiscoveryState {
  version: number;
  scopeKey: string;
  createdAt: string;
  updatedAt: string;
  queries: string[];
  urls: Record<string, LeadDiscoveryStateEntry>;
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

export class CuratedLeadDiscoveryStateRepository {
  async load(statePath: string, scopeKey: string): Promise<LeadDiscoveryState> {
    const nowIso = new Date().toISOString();
    const fromDisk =
      await tryReadJsonFile<Partial<LeadDiscoveryState>>(statePath);

    if (!fromDisk || typeof fromDisk !== "object") {
      return {
        version: 1,
        scopeKey,
        createdAt: nowIso,
        updatedAt: nowIso,
        queries: [],
        urls: {},
      };
    }

    return {
      version: 1,
      scopeKey,
      createdAt:
        typeof fromDisk.createdAt === "string" ? fromDisk.createdAt : nowIso,
      updatedAt: nowIso,
      queries: Array.isArray(fromDisk.queries) ? fromDisk.queries : [],
      urls:
        fromDisk.urls && typeof fromDisk.urls === "object"
          ? (fromDisk.urls as Record<string, LeadDiscoveryStateEntry>)
          : {},
    };
  }

  async save(statePath: string, state: LeadDiscoveryState): Promise<void> {
    const nextState: LeadDiscoveryState = {
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
