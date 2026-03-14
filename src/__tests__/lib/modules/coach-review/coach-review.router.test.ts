import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CoachReviewNotEligibleError,
  CoachReviewNotFoundError,
} from "@/lib/modules/coach-review/errors/coach-review.errors";

const TEST_IDS = {
  userId: "11111111-1111-4111-8111-111111111111",
  coachId: "22222222-2222-4222-8222-222222222222",
  reviewId: "33333333-3333-4333-8333-333333333333",
};

const mockCoachReviewService = {
  listActiveReviews: vi.fn(),
  getAggregate: vi.fn(),
  getViewerReview: vi.fn(),
  getViewerEligibility: vi.fn(),
  upsertReview: vi.fn(),
  removeOwnReview: vi.fn(),
};

const revalidateSpy = vi.fn(async () => undefined);

vi.mock("@/lib/modules/coach-review/factories/coach-review.factory", () => ({
  makeCoachReviewService: () => mockCoachReviewService,
}));

vi.mock("@/lib/shared/infra/cache/revalidate-public-coach-detail", () => ({
  revalidatePublicCoachDetailPaths: (...args: unknown[]) =>
    revalidateSpy(...args),
}));

import { coachReviewRouter } from "@/lib/modules/coach-review/coach-review.router";

const createProtectedCaller = () =>
  coachReviewRouter.createCaller({
    requestId: "req-1",
    clientIdentifier: "client-1",
    clientIdentifierSource: "fallback",
    session: {
      userId: TEST_IDS.userId,
      email: "player@example.com",
      role: "member",
    },
    userId: TEST_IDS.userId,
    cookies: { getAll: () => [], setAll: () => undefined },
    origin: "http://localhost:3000",
    log: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      fatal: vi.fn(),
      trace: vi.fn(),
      silent: vi.fn(),
      level: "info",
      msgPrefix: "",
    } as unknown,
  } as unknown as Parameters<typeof coachReviewRouter.createCaller>[0]);

const createPublicCaller = () =>
  coachReviewRouter.createCaller({
    requestId: "req-public",
    clientIdentifier: "client-public",
    clientIdentifierSource: "fallback",
    session: null,
    userId: null,
    cookies: { getAll: () => [], setAll: () => undefined },
    origin: "http://localhost:3000",
    log: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      fatal: vi.fn(),
      trace: vi.fn(),
      silent: vi.fn(),
      level: "info",
      msgPrefix: "",
    } as unknown,
  } as unknown as Parameters<typeof coachReviewRouter.createCaller>[0]);

describe("coachReviewRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("list exposes public coach review results", async () => {
    const caller = createPublicCaller();
    const payload = {
      items: [
        {
          id: TEST_IDS.reviewId,
          coachId: TEST_IDS.coachId,
          authorUserId: TEST_IDS.userId,
          authorDisplayName: "Player One",
          authorAvatarUrl: null,
          rating: 5,
          body: "Great session",
          createdAt: new Date("2026-03-10T08:00:00.000Z"),
          updatedAt: new Date("2026-03-10T08:00:00.000Z"),
        },
      ],
      total: 1,
    };
    mockCoachReviewService.listActiveReviews.mockResolvedValue(payload);

    const result = await caller.list({
      coachId: TEST_IDS.coachId,
      limit: 5,
      offset: 0,
    });

    expect(result).toEqual(payload);
    expect(mockCoachReviewService.listActiveReviews).toHaveBeenCalledWith({
      coachId: TEST_IDS.coachId,
      limit: 5,
      offset: 0,
    });
  });

  it("viewerEligibility returns the protected viewer state", async () => {
    const caller = createProtectedCaller();
    const payload = { canReview: false, reason: "NO_COMPLETED_SESSION" };
    mockCoachReviewService.getViewerEligibility.mockResolvedValue(payload);

    const result = await caller.viewerEligibility({
      coachId: TEST_IDS.coachId,
    });

    expect(result).toEqual(payload);
    expect(mockCoachReviewService.getViewerEligibility).toHaveBeenCalledWith(
      TEST_IDS.userId,
      TEST_IDS.coachId,
    );
  });

  it("upsert revalidates the public coach detail path after success", async () => {
    const caller = createProtectedCaller();
    const payload = {
      id: TEST_IDS.reviewId,
      coachId: TEST_IDS.coachId,
      authorUserId: TEST_IDS.userId,
      rating: 5,
      body: "Great session",
    };
    mockCoachReviewService.upsertReview.mockResolvedValue(payload);

    const result = await caller.upsert({
      coachId: TEST_IDS.coachId,
      rating: 5,
      body: "Great session",
    });

    expect(result).toEqual(payload);
    expect(mockCoachReviewService.upsertReview).toHaveBeenCalledWith(
      TEST_IDS.userId,
      {
        coachId: TEST_IDS.coachId,
        rating: 5,
        body: "Great session",
      },
    );
    expect(revalidateSpy).toHaveBeenCalledWith({
      coachId: TEST_IDS.coachId,
      requestId: "req-1",
    });
  });

  it("upsert maps ineligible review attempts to BAD_REQUEST", async () => {
    const caller = createProtectedCaller();
    mockCoachReviewService.upsertReview.mockRejectedValue(
      new CoachReviewNotEligibleError(TEST_IDS.coachId),
    );

    await expect(
      caller.upsert({
        coachId: TEST_IDS.coachId,
        rating: 4,
      }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  it("remove returns success and revalidates the public coach detail path", async () => {
    const caller = createProtectedCaller();
    mockCoachReviewService.removeOwnReview.mockResolvedValue({
      id: TEST_IDS.reviewId,
      coachId: TEST_IDS.coachId,
    });

    const result = await caller.remove({ reviewId: TEST_IDS.reviewId });

    expect(result).toEqual({ success: true });
    expect(mockCoachReviewService.removeOwnReview).toHaveBeenCalledWith(
      TEST_IDS.userId,
      TEST_IDS.reviewId,
    );
    expect(revalidateSpy).toHaveBeenCalledWith({
      coachId: TEST_IDS.coachId,
      requestId: "req-1",
    });
  });

  it("remove maps missing reviews to NOT_FOUND", async () => {
    const caller = createProtectedCaller();
    mockCoachReviewService.removeOwnReview.mockRejectedValue(
      new CoachReviewNotFoundError(TEST_IDS.reviewId),
    );

    await expect(
      caller.remove({ reviewId: TEST_IDS.reviewId }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});
