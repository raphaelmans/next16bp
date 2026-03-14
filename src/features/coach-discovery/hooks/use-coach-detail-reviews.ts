"use client";

import type { inferRouterOutputs } from "@trpc/server";
import { useCallback } from "react";
import type { AppRouter } from "@/lib/shared/infra/trpc/root";
import { trpc } from "@/trpc/client";

type CoachReviewRouterOutput = inferRouterOutputs<AppRouter>["coachReview"];

export type CoachReviewAggregate = CoachReviewRouterOutput["aggregate"];
export type CoachReviewAggregateSummary = {
  averageRating: number | null;
  reviewCount: number;
};
export type CoachReviewListResult = CoachReviewRouterOutput["list"];
export type CoachReviewEligibility =
  CoachReviewRouterOutput["viewerEligibility"];

const EMPTY_REVIEW_HISTOGRAM: CoachReviewAggregate["histogram"] = {
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0,
};

type CoachDetailReviewMutationOptions = {
  isAuthenticated?: boolean;
  onSuccess?: () => Promise<void> | void;
};

export function buildCoachReviewAggregateInitialData(
  aggregate?: CoachReviewAggregateSummary | null,
): CoachReviewAggregate | undefined {
  if (!aggregate) {
    return undefined;
  }

  return {
    averageRating: aggregate.averageRating ?? 0,
    reviewCount: aggregate.reviewCount,
    histogram: { ...EMPTY_REVIEW_HISTOGRAM },
  };
}

export function useQueryCoachDetailReviewAggregate(
  coachId: string,
  options?: {
    initialData?: CoachReviewAggregate;
    refetchOnMount?: boolean | "always";
    staleTime?: number;
  },
) {
  return trpc.coachReview.aggregate.useQuery(
    { coachId },
    {
      enabled: Boolean(coachId),
      ...(options?.refetchOnMount
        ? { refetchOnMount: options.refetchOnMount }
        : {}),
      ...(typeof options?.staleTime === "number"
        ? { staleTime: options.staleTime }
        : {}),
      ...(options?.initialData ? { initialData: options.initialData } : {}),
    },
  );
}

export function useQueryCoachDetailReviews({
  coachId,
  limit,
  offset,
  initialData,
}: {
  coachId: string;
  limit: number;
  offset: number;
  initialData?: CoachReviewListResult;
}) {
  return trpc.coachReview.list.useQuery(
    { coachId, limit, offset },
    {
      enabled: Boolean(coachId),
      ...(initialData ? { initialData } : {}),
    },
  );
}

export function useQueryCoachDetailViewerReview(
  coachId: string,
  options?: {
    enabled?: boolean;
  },
) {
  return trpc.coachReview.viewerReview.useQuery(
    { coachId },
    { enabled: Boolean(coachId) && (options?.enabled ?? true) },
  );
}

export function useQueryCoachDetailViewerEligibility(
  coachId: string,
  options?: {
    enabled?: boolean;
  },
) {
  return trpc.coachReview.viewerEligibility.useQuery(
    { coachId },
    { enabled: Boolean(coachId) && (options?.enabled ?? true) },
  );
}

function useInvalidateCoachDetailReviewQueries(
  coachId: string,
  isAuthenticated: boolean,
) {
  const utils = trpc.useUtils();

  return useCallback(async () => {
    await Promise.all([
      utils.coachReview.aggregate.invalidate({ coachId }),
      utils.coachReview.list.invalidate(),
      isAuthenticated
        ? utils.coachReview.viewerReview.invalidate({ coachId })
        : Promise.resolve(),
      isAuthenticated
        ? utils.coachReview.viewerEligibility.invalidate({ coachId })
        : Promise.resolve(),
    ]);
  }, [coachId, isAuthenticated, utils]);
}

export function useMutCoachDetailUpsertReview(
  coachId: string,
  options?: CoachDetailReviewMutationOptions,
) {
  const invalidateReviewQueries = useInvalidateCoachDetailReviewQueries(
    coachId,
    Boolean(options?.isAuthenticated),
  );

  return trpc.coachReview.upsert.useMutation({
    onSuccess: async () => {
      await invalidateReviewQueries();
      await options?.onSuccess?.();
    },
  });
}

export function useMutCoachDetailRemoveReview(
  coachId: string,
  options?: CoachDetailReviewMutationOptions,
) {
  const invalidateReviewQueries = useInvalidateCoachDetailReviewQueries(
    coachId,
    Boolean(options?.isAuthenticated),
  );

  return trpc.coachReview.remove.useMutation({
    onSuccess: async () => {
      await invalidateReviewQueries();
      await options?.onSuccess?.();
    },
  });
}
