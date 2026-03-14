import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const hookState = vi.hoisted(() => ({
  session: null as { user: { id: string } } | null,
  aggregateQuery: {
    data: {
      averageRating: 4.7,
      reviewCount: 2,
      histogram: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 },
    },
    isLoading: false,
  },
  reviewsQuery: {
    data: {
      items: [
        {
          id: "review-1",
          coachId: "coach-1",
          authorUserId: "user-2",
          authorDisplayName: "Player One",
          authorAvatarUrl: null,
          rating: 5,
          body: "Excellent pacing and feedback.",
          createdAt: "2026-03-10T08:00:00.000Z",
          updatedAt: "2026-03-10T08:00:00.000Z",
        },
      ],
      total: 1,
    },
    isLoading: false,
  },
  viewerReviewQuery: {
    data: null as {
      id: string;
      rating: number;
      body: string | null;
    } | null,
  },
  viewerEligibilityQuery: {
    data: {
      canReview: true,
      reason: null as "NO_PROFILE" | "NO_COMPLETED_SESSION" | null,
    },
    isLoading: false,
  },
}));

const routerRefresh = vi.fn();
const routerPush = vi.fn();

vi.mock("@/features/auth/hooks", () => ({
  useQueryAuthSession: () => ({ data: hookState.session }),
}));

vi.mock("@/features/coach-discovery/hooks/use-coach-detail-reviews", () => ({
  buildCoachReviewAggregateInitialData: vi.fn((value) =>
    value
      ? {
          averageRating: value.averageRating ?? 0,
          reviewCount: value.reviewCount,
          histogram: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        }
      : undefined,
  ),
  useQueryCoachDetailReviewAggregate: () => hookState.aggregateQuery,
  useQueryCoachDetailReviews: () => hookState.reviewsQuery,
  useQueryCoachDetailViewerReview: () => hookState.viewerReviewQuery,
  useQueryCoachDetailViewerEligibility: () => hookState.viewerEligibilityQuery,
  useMutCoachDetailUpsertReview: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useMutCoachDetailRemoveReview: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: routerRefresh,
    push: routerPush,
  }),
  usePathname: () => "/coaches/coach-carla",
}));

import { CoachDetailReviewsSection } from "@/features/coach-discovery/components/coach-detail/coach-detail-reviews";

describe("CoachDetailReviewsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hookState.session = null;
    hookState.aggregateQuery = {
      data: {
        averageRating: 4.7,
        reviewCount: 2,
        histogram: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 },
      },
      isLoading: false,
    };
    hookState.reviewsQuery = {
      data: {
        items: [
          {
            id: "review-1",
            coachId: "coach-1",
            authorUserId: "user-2",
            authorDisplayName: "Player One",
            authorAvatarUrl: null,
            rating: 5,
            body: "Excellent pacing and feedback.",
            createdAt: "2026-03-10T08:00:00.000Z",
            updatedAt: "2026-03-10T08:00:00.000Z",
          },
        ],
        total: 1,
      },
      isLoading: false,
    };
    hookState.viewerReviewQuery = {
      data: null,
    };
    hookState.viewerEligibilityQuery = {
      data: { canReview: true, reason: null },
      isLoading: false,
    };
  });

  it("renders public review aggregate and recent reviews", () => {
    render(
      <CoachDetailReviewsSection
        coachId="coach-1"
        initialAggregate={{ averageRating: 4.7, reviewCount: 2 }}
      />,
    );

    expect(screen.getByText("Reviews")).toBeTruthy();
    expect(screen.getByText("4.7")).toBeTruthy();
    expect(screen.getByText("2 reviews")).toBeTruthy();
    expect(screen.getByText("Player One")).toBeTruthy();
    expect(screen.getByText("Excellent pacing and feedback.")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Sign in to write a review" }),
    ).toBeTruthy();
  });

  it("renders the empty state and ineligible copy for signed-in players without a completed session", () => {
    hookState.session = { user: { id: "user-1" } };
    hookState.aggregateQuery = {
      data: {
        averageRating: 0,
        reviewCount: 0,
        histogram: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      },
      isLoading: false,
    };
    hookState.reviewsQuery = {
      data: {
        items: [],
        total: 0,
      },
      isLoading: false,
    };
    hookState.viewerEligibilityQuery = {
      data: { canReview: false, reason: "NO_COMPLETED_SESSION" },
      isLoading: false,
    };

    render(<CoachDetailReviewsSection coachId="coach-1" />);

    expect(
      screen.getByText(
        "No reviews yet. Completed players can be the first to share their session experience.",
      ),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Write a review" })).toBeTruthy();
    expect(
      screen.getByText(
        "Only players with a completed confirmed session can review this coach.",
      ),
    ).toBeTruthy();
  });
});
