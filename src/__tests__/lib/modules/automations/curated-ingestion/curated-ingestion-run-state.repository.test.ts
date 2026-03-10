import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { CuratedIngestionRunStateRepository } from "@/lib/modules/automations/curated-ingestion/repositories/curated-ingestion-run-state.repository";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

describe("curated ingestion run state repository", () => {
  it("creates a default state when no file exists", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "curated-run-state-"));
    tempDirs.push(tempDir);

    const repository = new CuratedIngestionRunStateRepository();
    const state = await repository.load(
      path.join(tempDir, "run-state.json"),
      "pickleball:cebu:talisay-city",
      {
        provinceSlug: "cebu",
        citySlug: "talisay-city",
        provinceName: "Cebu",
        cityName: "Talisay City",
        sportSlug: "pickleball",
      },
    );

    expect(state.scope.provinceSlug).toBe("cebu");
    expect(state.stages.discovery.status).toBe("pending");
    expect(state.stages.facebookDiscovery.status).toBe("pending");
    expect(state.stages.facebookCapture.status).toBe("pending");
    expect(state.stages.embeddingBackfill.status).toBe("pending");
    expect(state.importedPlaceIds).toEqual([]);
  });

  it("persists and reloads stage progress", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "curated-run-state-"));
    tempDirs.push(tempDir);

    const repository = new CuratedIngestionRunStateRepository();
    const statePath = path.join(tempDir, "run-state.json");
    const state = await repository.load(
      statePath,
      "pickleball:cebu:talisay-city",
      {
        provinceSlug: "cebu",
        citySlug: "talisay-city",
        provinceName: "Cebu",
        cityName: "Talisay City",
        sportSlug: "pickleball",
      },
    );

    state.importedPlaceIds = ["place-1"];
    state.stages.discovery.status = "completed";
    state.stages.facebookCapture.status = "completed";
    state.stages.scrape.status = "failed";
    state.stages.scrape.lastError = "gateway";

    await repository.save(statePath, state);

    const reloaded = await repository.load(
      statePath,
      "pickleball:cebu:talisay-city",
      {
        provinceSlug: "cebu",
        citySlug: "talisay-city",
        provinceName: "Cebu",
        cityName: "Talisay City",
        sportSlug: "pickleball",
      },
    );

    expect(reloaded.importedPlaceIds).toEqual(["place-1"]);
    expect(reloaded.stages.discovery.status).toBe("completed");
    expect(reloaded.stages.facebookCapture.status).toBe("completed");
    expect(reloaded.stages.scrape.status).toBe("failed");
    expect(reloaded.stages.scrape.lastError).toBe("gateway");
  });
});
