import { describe, expect, it, vi } from "vitest";
import { CoachReviewNotEligibleError } from "@/lib/modules/coach-review/errors/coach-review.errors";
import { CoachReviewService } from "@/lib/modules/coach-review/services/coach-review.service";
import type {
  CoachReviewRecord,
  ProfileRecord,
  ReservationRecord,
} from "@/lib/shared/infra/db/schema";

type CoachReviewServiceDeps = ConstructorParameters<typeof CoachReviewService>;

const TEST_IDS = {
  userId: "11111111-1111-4111-8111-111111111111",
  profileId: "22222222-2222-4222-8222-222222222222",
  coachId: "33333333-3333-4333-8333-333333333333",
  reviewId: "44444444-4444-4444-8444-444444444444",
  reservationId: "55555555-5555-4555-8555-555555555555",
};

const now = new Date("2026-03-15T12:00:00.000Z");

const createReviewRecord = (
  value: Partial<CoachReviewRecord> = {},
): CoachReviewRecord =>
  ({
    id: TEST_IDS.reviewId,
    coachId: TEST_IDS.coachId,
    authorUserId: TEST_IDS.userId,
    rating: 5,
    body: "Great session",
    removedAt: null,
    removedByUserId: null,
    removalReason: null,
    createdAt: now,
    updatedAt: now,
    ...value,
  }) as CoachReviewRecord;

const createProfileRecord = (
  value: Partial<ProfileRecord> = {},
): ProfileRecord =>
  ({
    id: TEST_IDS.profileId,
    userId: TEST_IDS.userId,
    displayName: "Player One",
    email: "player@example.com",
    phoneNumber: "+63 900 000 0000",
    avatarUrl: null,
    createdAt: now,
    updatedAt: now,
    ...value,
  }) as ProfileRecord;

const createReservationRecord = (
  value: Partial<ReservationRecord> = {},
): ReservationRecord =>
  ({
    id: TEST_IDS.reservationId,
    courtId: null,
    coachId: TEST_IDS.coachId,
    startTime: new Date("2026-03-10T08:00:00.000Z"),
    endTime: new Date("2026-03-10T09:00:00.000Z"),
    totalPriceCents: 150000,
    currency: "PHP",
    playerId: TEST_IDS.profileId,
    groupId: null,
    guestProfileId: null,
    playerNameSnapshot: "Player One",
    playerEmailSnapshot: "player@example.com",
    playerPhoneSnapshot: "+63 900 000 0000",
    status: "CONFIRMED",
    expiresAt: null,
    termsAcceptedAt: now,
    confirmedAt: now,
    cancelledAt: null,
    cancellationReason: null,
    createdAt: now,
    pingOwnerCount: 0,
    updatedAt: now,
    ...value,
  }) as ReservationRecord;

function createHarness() {
  const tx = { txId: "coach-review-tx" };
  const reviewRepository = {
    findActiveByCoachAndUser: vi.fn<() => Promise<CoachReviewRecord | null>>(
      async () => null,
    ),
    findById: vi.fn<() => Promise<CoachReviewRecord | null>>(async () => null),
    upsertActive: vi.fn(async () => createReviewRecord()),
    softRemove: vi.fn(async () => undefined),
    getAggregate: vi.fn(async () => ({
      averageRating: 4.8,
      reviewCount: 2,
      histogram: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 },
    })),
    listActiveByCoach: vi.fn<
      () => Promise<{
        items: Array<{
          id: string;
          coachId: string;
          authorUserId: string;
          authorDisplayName: string;
          authorAvatarUrl: string | null;
          rating: number;
          body: string | null;
          createdAt: Date;
          updatedAt: Date;
        }>;
        total: number;
      }>
    >(async () => ({ items: [], total: 0 })),
  };
  const profileRepository = {
    findByUserId: vi.fn<() => Promise<ProfileRecord | null>>(async () => null),
  };
  const reservationRepository = {
    findPastConfirmedCoachReservationForPlayer: vi.fn<
      () => Promise<ReservationRecord | null>
    >(async () => null),
  };
  const run = vi.fn(async (fn: (txArg: unknown) => Promise<unknown>) => fn(tx));

  const service = new CoachReviewService(
    reviewRepository as unknown as CoachReviewServiceDeps[0],
    profileRepository as unknown as CoachReviewServiceDeps[1],
    reservationRepository as unknown as CoachReviewServiceDeps[2],
    { run } as unknown as CoachReviewServiceDeps[3],
  );

  return {
    service,
    reviewRepository,
    profileRepository,
    reservationRepository,
    run,
    tx,
  };
}

describe("CoachReviewService", () => {
  it("upsertReview allows an eligible player with a completed confirmed session", async () => {
    const harness = createHarness();
    const profile = createProfileRecord();
    const reservation = createReservationRecord();
    const review = createReviewRecord({ rating: 4, body: "Sharp feedback" });

    harness.profileRepository.findByUserId.mockResolvedValue(profile);
    harness.reservationRepository.findPastConfirmedCoachReservationForPlayer.mockResolvedValue(
      reservation,
    );
    harness.reviewRepository.upsertActive.mockResolvedValue(review);

    const result = await harness.service.upsertReview(TEST_IDS.userId, {
      coachId: TEST_IDS.coachId,
      rating: 4,
      body: "Sharp feedback",
    });

    expect(harness.run).toHaveBeenCalledTimes(1);
    expect(harness.profileRepository.findByUserId).toHaveBeenCalledWith(
      TEST_IDS.userId,
    );
    expect(
      harness.reservationRepository.findPastConfirmedCoachReservationForPlayer,
    ).toHaveBeenCalledWith(TEST_IDS.coachId, TEST_IDS.profileId);
    expect(harness.reviewRepository.upsertActive).toHaveBeenCalledWith(
      {
        coachId: TEST_IDS.coachId,
        authorUserId: TEST_IDS.userId,
        rating: 4,
        body: "Sharp feedback",
      },
      { tx: harness.tx },
    );
    expect(result).toBe(review);
  });

  it("upsertReview updates an existing active review without rechecking eligibility", async () => {
    const harness = createHarness();
    const existing = createReviewRecord();
    const updated = createReviewRecord({ rating: 3, body: "Updated review" });

    harness.reviewRepository.findActiveByCoachAndUser.mockResolvedValue(
      existing,
    );
    harness.reviewRepository.upsertActive.mockResolvedValue(updated);

    const result = await harness.service.upsertReview(TEST_IDS.userId, {
      coachId: TEST_IDS.coachId,
      rating: 3,
      body: "Updated review",
    });

    expect(harness.profileRepository.findByUserId).not.toHaveBeenCalled();
    expect(
      harness.reservationRepository.findPastConfirmedCoachReservationForPlayer,
    ).not.toHaveBeenCalled();
    expect(result).toBe(updated);
  });

  it("upsertReview rejects ineligible players without a completed confirmed session", async () => {
    const harness = createHarness();
    harness.profileRepository.findByUserId.mockResolvedValue(
      createProfileRecord(),
    );

    await expect(
      harness.service.upsertReview(TEST_IDS.userId, {
        coachId: TEST_IDS.coachId,
        rating: 5,
        body: "Great coach",
      }),
    ).rejects.toBeInstanceOf(CoachReviewNotEligibleError);

    expect(harness.reviewRepository.upsertActive).not.toHaveBeenCalled();
  });

  it("removeOwnReview soft deletes the author's review", async () => {
    const harness = createHarness();
    const review = createReviewRecord();
    harness.reviewRepository.findById.mockResolvedValue(review);

    const result = await harness.service.removeOwnReview(
      TEST_IDS.userId,
      TEST_IDS.reviewId,
    );

    expect(harness.reviewRepository.softRemove).toHaveBeenCalledWith(
      TEST_IDS.reviewId,
      TEST_IDS.userId,
      undefined,
      { tx: harness.tx },
    );
    expect(result).toBe(review);
  });

  it("listActiveReviews delegates to the repository", async () => {
    const harness = createHarness();
    const payload = {
      items: [
        {
          id: TEST_IDS.reviewId,
          coachId: TEST_IDS.coachId,
          authorUserId: TEST_IDS.userId,
          authorDisplayName: "Player One",
          authorAvatarUrl: null,
          rating: 5,
          body: "Great coach",
          createdAt: now,
          updatedAt: now,
        },
      ],
      total: 1,
    };
    harness.reviewRepository.listActiveByCoach.mockResolvedValue(payload);

    await expect(
      harness.service.listActiveReviews({
        coachId: TEST_IDS.coachId,
        limit: 5,
        offset: 0,
      }),
    ).resolves.toEqual(payload);

    expect(harness.reviewRepository.listActiveByCoach).toHaveBeenCalledWith(
      TEST_IDS.coachId,
      5,
      0,
    );
  });
});
