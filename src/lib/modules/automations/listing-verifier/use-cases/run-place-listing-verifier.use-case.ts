import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { IPlaceListingVerifierRepository } from "../repositories/place-listing-verifier.repository";
import type { IPlaceListingVerifierService } from "../services/place-listing-verifier.service";
import {
  chunkItems,
  renderMarkdownReport,
  summarizeReport,
  toListingEvidence,
  toTrackingBucket,
} from "../shared/place-listing-verifier.domain";

export interface RunPlaceListingVerifierInput {
  model: string;
  batchSize: number;
  limit: number | null;
  envLabel: string;
  outputDir: string;
  placeTypeFilter: "all" | "curated" | "org";
}

export class RunPlaceListingVerifierUseCase {
  constructor(
    private readonly repository: IPlaceListingVerifierRepository,
    private readonly verifier: IPlaceListingVerifierService,
  ) {}

  async execute(input: RunPlaceListingVerifierInput) {
    const rows = await this.repository.listPlaceEvidence({
      limit: input.limit,
      placeTypeFilter: input.placeTypeFilter,
    });

    const evidence = rows.map((row) =>
      toListingEvidence({
        placeId: row.placeId,
        trackingBucket: toTrackingBucket(row.placeType),
        placeType: row.placeType,
        organizationId: row.organizationId,
        slug: row.slug,
        name: row.name,
        address: row.address,
        city: row.city,
        province: row.province,
        country: row.country,
        claimStatus: row.claimStatus,
        verificationStatus: row.verificationStatus,
        activeCourtCount: row.activeCourtCount,
        activeCourtLabels: row.activeCourtLabels,
        activeSports: row.activeSports,
        photoCount: row.photoCount,
        hasContactDetails: row.hasContactDetails,
      }),
    );

    const results: Array<{
      evidence: (typeof evidence)[number];
      decision: Awaited<
        ReturnType<IPlaceListingVerifierService["verifyBatch"]>
      >[number];
    }> = [];

    for (const batch of chunkItems(evidence, input.batchSize)) {
      const decisions = await this.verifier.verifyBatch(batch, {
        model: input.model,
      });

      for (let index = 0; index < batch.length; index += 1) {
        const item = batch[index];
        const decision = decisions[index];
        if (!item || !decision) continue;
        results.push({ evidence: item, decision });
      }
    }

    const report = summarizeReport({
      envLabel: input.envLabel,
      model: input.model,
      batchSize: input.batchSize,
      results,
    });

    const resolvedDir = path.resolve(
      process.cwd(),
      input.outputDir,
      input.envLabel,
    );
    await mkdir(resolvedDir, { recursive: true });

    await Promise.all([
      writeFile(
        path.join(resolvedDir, "latest-results.json"),
        `${JSON.stringify(report.results, null, 2)}\n`,
        "utf-8",
      ),
      writeFile(
        path.join(resolvedDir, "latest-summary.json"),
        `${JSON.stringify(report, null, 2)}\n`,
        "utf-8",
      ),
      writeFile(
        path.join(resolvedDir, "latest-summary.md"),
        `${renderMarkdownReport(report)}\n`,
        "utf-8",
      ),
    ]);

    return report;
  }
}
