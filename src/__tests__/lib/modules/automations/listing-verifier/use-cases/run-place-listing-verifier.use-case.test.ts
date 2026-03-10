import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type {
  IPlaceListingVerifierRepository,
  PlaceListingEvidenceRow,
} from "@/lib/modules/automations/listing-verifier/repositories/place-listing-verifier.repository";
import type { IPlaceListingVerifierService } from "@/lib/modules/automations/listing-verifier/services/place-listing-verifier.service";
import type {
  PlaceListingDecision,
  PlaceListingEvidence,
} from "@/lib/modules/automations/listing-verifier/shared/place-listing-verifier.schemas";
import { RunPlaceListingVerifierUseCase } from "@/lib/modules/automations/listing-verifier/use-cases/run-place-listing-verifier.use-case";

class FakeRepository implements IPlaceListingVerifierRepository {
  constructor(private readonly rows: PlaceListingEvidenceRow[]) {}

  async listPlaceEvidence() {
    return this.rows;
  }
}

class FakeVerifier implements IPlaceListingVerifierService {
  async verifyBatch(
    batch: PlaceListingEvidence[],
    _options: { model: string },
  ): Promise<PlaceListingDecision[]> {
    return batch.map((item) => ({
      placeId: item.placeId,
      trackingBucket: item.trackingBucket,
      label: item.placeId.endsWith("1") ? "remove" : "keep",
      confidence: "high" as const,
      reasonCode: item.placeId.endsWith("1")
        ? ("nonprod_or_test" as const)
        : ("looks_valid" as const),
      reasonSummary: item.placeId.endsWith("1")
        ? "Obvious test record."
        : "Looks valid.",
    }));
  }
}

describe("RunPlaceListingVerifierUseCase", () => {
  it("writes json and markdown reports", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "listing-verifier-"));
    const useCase = new RunPlaceListingVerifierUseCase(
      new FakeRepository([
        {
          placeId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1",
          placeType: "CURATED",
          organizationId: null,
          slug: "test-clubs",
          name: "Test Clubs",
          address: "123 Sample Street",
          city: "CEBU CITY",
          province: "CEBU",
          country: "PH",
          claimStatus: "UNCLAIMED",
          verificationStatus: "NONE",
          activeCourtCount: 1,
          activeCourtLabels: ["Court 1"],
          activeSports: ["pickleball"],
          photoCount: 0,
          hasContactDetails: false,
        },
        {
          placeId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2",
          placeType: "RESERVABLE",
          organizationId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
          slug: "kudos-courts-complex",
          name: "Kudos Courts Complex",
          address: "101 Waterfront Road",
          city: "CEBU CITY",
          province: "CEBU",
          country: "PH",
          claimStatus: "CLAIMED",
          verificationStatus: "VERIFIED",
          activeCourtCount: 3,
          activeCourtLabels: ["Court A", "Court B"],
          activeSports: ["pickleball"],
          photoCount: 3,
          hasContactDetails: true,
        },
      ]),
      new FakeVerifier(),
    );

    const report = await useCase.execute({
      model: "gpt-5-mini",
      batchSize: 2,
      limit: null,
      envLabel: "local",
      outputDir: tempDir,
      placeTypeFilter: "all",
    });

    expect(report.totalPlaces).toBe(2);
    expect(report.labelCounts.remove).toBe(1);
    expect(report.labelCounts.keep).toBe(1);

    const summaryJson = await readFile(
      path.join(tempDir, "local", "latest-summary.json"),
      "utf-8",
    );
    const summaryMd = await readFile(
      path.join(tempDir, "local", "latest-summary.md"),
      "utf-8",
    );

    expect(summaryJson).toContain('"totalPlaces": 2');
    expect(summaryMd).toContain("# Place Listing Verifier Report");
    expect(summaryMd).toContain("test-clubs");
  });
});
