import { and, asc, eq, inArray, isNotNull } from "drizzle-orm";
import {
  court,
  place,
  placeAmenity,
  placeContactDetail,
  placePhoto,
} from "@/lib/shared/infra/db/schema";
import type { DbClient } from "@/lib/shared/infra/db/types";
import type {
  CuratedPlaceEnhancementCandidate,
  CuratedPlaceEnhancementPersistInput,
  CuratedPlaceEnhancementRepository,
  CuratedPlaceEnhancementSourceMode,
} from "../services/curated-place-enhancement.service";

function filterCandidates(
  candidates: CuratedPlaceEnhancementCandidate[],
  input: {
    sourceMode: CuratedPlaceEnhancementSourceMode;
    retryFailed: boolean;
    retryReviewRequired: boolean;
  },
) {
  return candidates.filter((candidate) => {
    const websiteEligible =
      Boolean(candidate.contactDetail?.websiteUrl) &&
      candidate.place.websiteEnhancementStatus !== "COMPLETED" &&
      (input.retryFailed ||
        candidate.place.websiteEnhancementStatus !== "FAILED") &&
      (input.retryReviewRequired ||
        candidate.place.websiteEnhancementStatus !== "REVIEW_REQUIRED");
    const facebookEligible =
      Boolean(candidate.contactDetail?.facebookUrl) &&
      candidate.place.facebookEnhancementStatus !== "COMPLETED" &&
      (input.retryFailed ||
        candidate.place.facebookEnhancementStatus !== "FAILED") &&
      (input.retryReviewRequired ||
        candidate.place.facebookEnhancementStatus !== "REVIEW_REQUIRED");

    if (input.sourceMode === "website") {
      return websiteEligible;
    }
    if (input.sourceMode === "facebook") {
      return facebookEligible;
    }

    return (
      websiteEligible ||
      (!candidate.contactDetail?.websiteUrl && facebookEligible)
    );
  });
}

export class DbCuratedPlaceEnhancementRepository
  implements CuratedPlaceEnhancementRepository
{
  constructor(private db: DbClient) {}

  async findCandidatesByIds(
    placeIds: string[],
  ): Promise<CuratedPlaceEnhancementCandidate[]> {
    if (placeIds.length === 0) {
      return [];
    }

    const rows = await this.db
      .select({
        place,
        contactDetail: placeContactDetail,
      })
      .from(place)
      .leftJoin(placeContactDetail, eq(placeContactDetail.placeId, place.id))
      .where(inArray(place.id, placeIds));

    return this.hydrateCandidates(rows);
  }

  async listEligibleCandidates(input: {
    limit: number | null;
    sourceMode: CuratedPlaceEnhancementSourceMode;
    retryFailed: boolean;
    retryReviewRequired: boolean;
  }): Promise<CuratedPlaceEnhancementCandidate[]> {
    const rows = await this.db
      .select({
        place,
        contactDetail: placeContactDetail,
      })
      .from(place)
      .leftJoin(placeContactDetail, eq(placeContactDetail.placeId, place.id))
      .where(
        and(
          eq(place.placeType, "CURATED"),
          eq(place.isActive, true),
          isNotNull(placeContactDetail.placeId),
        ),
      )
      .orderBy(asc(place.createdAt));

    const hydrated = await this.hydrateCandidates(rows);
    const filtered = filterCandidates(hydrated, input);

    return input.limit === null ? filtered : filtered.slice(0, input.limit);
  }

  async persistOutcome(
    input: CuratedPlaceEnhancementPersistInput,
  ): Promise<{ changed: boolean }> {
    const now = new Date();

    await this.db.transaction(async (tx) => {
      const placePatch: Partial<typeof place.$inferInsert> = {};

      if (input.website) {
        placePatch.websiteEnhancementStatus = input.website.status;
        placePatch.websiteEnhancementAttemptedAt = new Date(
          input.website.attemptedAt,
        );
        placePatch.websiteEnhancedAt = input.website.enhancedAt
          ? new Date(input.website.enhancedAt)
          : null;
        placePatch.websiteEnhancementError = input.website.error;
      }
      if (input.facebook) {
        placePatch.facebookEnhancementStatus = input.facebook.status;
        placePatch.facebookEnhancementAttemptedAt = new Date(
          input.facebook.attemptedAt,
        );
        placePatch.facebookEnhancedAt = input.facebook.enhancedAt
          ? new Date(input.facebook.enhancedAt)
          : null;
        placePatch.facebookEnhancementError = input.facebook.error;
      }
      if (input.mergedRecord?.placePatch.name) {
        placePatch.name = input.mergedRecord.placePatch.name;
      }
      if (input.mergedRecord?.placePatch.address) {
        placePatch.address = input.mergedRecord.placePatch.address;
      }

      if (Object.keys(placePatch).length > 0) {
        await tx
          .update(place)
          .set({
            ...placePatch,
            updatedAt: now,
          })
          .where(eq(place.id, input.placeId));
      }

      if (
        input.mergedRecord &&
        Object.keys(input.mergedRecord.contactDetailPatch).length > 0
      ) {
        await tx
          .insert(placeContactDetail)
          .values({
            placeId: input.placeId,
            ...input.mergedRecord.contactDetailPatch,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: placeContactDetail.placeId,
            set: {
              ...input.mergedRecord.contactDetailPatch,
              updatedAt: now,
            },
          });
      }

      if (input.mergedRecord) {
        await tx
          .delete(placeAmenity)
          .where(eq(placeAmenity.placeId, input.placeId));
        if (input.mergedRecord.amenities.length > 0) {
          await tx.insert(placeAmenity).values(
            input.mergedRecord.amenities.map((name) => ({
              placeId: input.placeId,
              name,
            })),
          );
        }
      }

      if (input.mergedRecord?.photoUrlsToAdd.length) {
        const existingPhotos = await tx
          .select({
            displayOrder: placePhoto.displayOrder,
          })
          .from(placePhoto)
          .where(eq(placePhoto.placeId, input.placeId))
          .orderBy(asc(placePhoto.displayOrder));
        const nextDisplayOrder = existingPhotos.length;

        await tx.insert(placePhoto).values(
          input.mergedRecord.photoUrlsToAdd.map((url, index) => ({
            placeId: input.placeId,
            url,
            displayOrder: nextDisplayOrder + index,
          })),
        );
      }

      if (input.mergedRecord?.courtPlan.mode === "sync-generic") {
        const currentCourts = await tx
          .select({
            id: court.id,
            label: court.label,
          })
          .from(court)
          .where(
            and(eq(court.placeId, input.placeId), eq(court.isActive, true)),
          )
          .orderBy(asc(court.label));

        const desiredCount = input.mergedRecord.courtPlan.desiredCount;
        if (currentCourts.length > desiredCount) {
          const idsToDeactivate = currentCourts
            .slice(desiredCount)
            .map((item) => item.id);
          if (idsToDeactivate.length > 0) {
            await tx
              .update(court)
              .set({
                isActive: false,
                updatedAt: now,
              })
              .where(inArray(court.id, idsToDeactivate));
          }
        } else if (currentCourts.length < desiredCount) {
          const sportId = input.mergedRecord.courtPlan.sportId;
          if (!sportId) {
            return;
          }
          await tx.insert(court).values(
            Array.from(
              { length: desiredCount - currentCourts.length },
              (_, index) => ({
                placeId: input.placeId,
                sportId,
                label: `Court ${currentCourts.length + index + 1}`,
                isActive: true,
                updatedAt: now,
              }),
            ),
          );
        }
      }
    });

    return {
      changed: input.mergedRecord?.hasChanges ?? false,
    };
  }

  private async hydrateCandidates(
    rows: Array<{
      place: typeof place.$inferSelect;
      contactDetail: typeof placeContactDetail.$inferSelect | null;
    }>,
  ): Promise<CuratedPlaceEnhancementCandidate[]> {
    const placeIds = rows.map((row) => row.place.id);
    if (placeIds.length === 0) {
      return [];
    }

    const [amenities, photos, courtsForPlaces] = await Promise.all([
      this.db
        .select({
          placeId: placeAmenity.placeId,
          name: placeAmenity.name,
        })
        .from(placeAmenity)
        .where(inArray(placeAmenity.placeId, placeIds)),
      this.db
        .select({
          placeId: placePhoto.placeId,
          url: placePhoto.url,
        })
        .from(placePhoto)
        .where(inArray(placePhoto.placeId, placeIds))
        .orderBy(asc(placePhoto.displayOrder)),
      this.db
        .select({
          placeId: court.placeId,
          id: court.id,
          sportId: court.sportId,
          label: court.label,
          isActive: court.isActive,
        })
        .from(court)
        .where(inArray(court.placeId, placeIds)),
    ]);

    const amenitiesByPlaceId = new Map<string, string[]>();
    for (const item of amenities) {
      const next = amenitiesByPlaceId.get(item.placeId) ?? [];
      next.push(item.name);
      amenitiesByPlaceId.set(item.placeId, next);
    }

    const photosByPlaceId = new Map<string, string[]>();
    for (const item of photos) {
      const next = photosByPlaceId.get(item.placeId) ?? [];
      next.push(item.url);
      photosByPlaceId.set(item.placeId, next);
    }

    const courtsByPlaceId = new Map<
      string,
      CuratedPlaceEnhancementCandidate["courts"]
    >();
    for (const item of courtsForPlaces) {
      const placeId = item.placeId;
      if (!placeId) {
        continue;
      }
      const next = courtsByPlaceId.get(placeId) ?? [];
      next.push({
        id: item.id,
        sportId: item.sportId,
        label: item.label,
        isActive: item.isActive,
      });
      courtsByPlaceId.set(placeId, next);
    }

    return rows.map((row) => ({
      place: row.place,
      contactDetail: row.contactDetail,
      amenities: amenitiesByPlaceId.get(row.place.id) ?? [],
      photoUrls: photosByPlaceId.get(row.place.id) ?? [],
      courts: courtsByPlaceId.get(row.place.id) ?? [],
    }));
  }
}
