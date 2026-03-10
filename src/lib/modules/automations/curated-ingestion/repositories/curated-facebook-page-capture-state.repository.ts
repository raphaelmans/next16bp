import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export interface FacebookPageCaptureStateEntry {
  canonicalUrl: string;
  latestUrl: string;
  firstCapturedAt: string;
  lastCapturedAt: string;
  status: "captured" | "skipped" | "failed";
  title: string | null;
  venueName: string | null;
  confidence: "high" | "medium" | "low" | null;
  importStatus: "ready" | "review" | "skip" | null;
  error: string | null;
  outputRowName: string | null;
}

export interface FacebookPageCaptureState {
  version: number;
  scopeKey: string;
  createdAt: string;
  updatedAt: string;
  urls: Record<string, FacebookPageCaptureStateEntry>;
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

export class CuratedFacebookPageCaptureStateRepository {
  async load(
    statePath: string,
    scopeKey: string,
  ): Promise<FacebookPageCaptureState> {
    const nowIso = new Date().toISOString();
    const fromDisk =
      await tryReadJsonFile<Partial<FacebookPageCaptureState>>(statePath);

    if (!fromDisk || typeof fromDisk !== "object") {
      return {
        version: 1,
        scopeKey,
        createdAt: nowIso,
        updatedAt: nowIso,
        urls: {},
      };
    }

    return {
      version: 1,
      scopeKey,
      createdAt:
        typeof fromDisk.createdAt === "string" ? fromDisk.createdAt : nowIso,
      updatedAt: nowIso,
      urls:
        fromDisk.urls && typeof fromDisk.urls === "object"
          ? (fromDisk.urls as Record<string, FacebookPageCaptureStateEntry>)
          : {},
    };
  }

  async save(
    statePath: string,
    state: FacebookPageCaptureState,
  ): Promise<void> {
    const nextState: FacebookPageCaptureState = {
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
