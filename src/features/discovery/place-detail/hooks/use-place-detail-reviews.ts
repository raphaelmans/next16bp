"use client";

import type { inferRouterOutputs } from "@trpc/server";
import { useCallback } from "react";
import type { AppRouter } from "@/lib/shared/infra/trpc/root";
import { trpc } from "@/trpc/client";

type PlaceReviewRouterOutput = inferRouterOutputs<AppRouter>["placeReview"];

export type PlaceReviewAggregate = PlaceReviewRouterOutput["aggregate"];
export type PlaceReviewAggregateSummary = Pick<
  PlaceReviewAggregate,
  "averageRating" | "reviewCount"
>;

const EMPTY_REVIEW_HISTOGRAM: PlaceReviewAggregate["histogram"] = {
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0,
};

type PlaceDetailReviewMutationOptions = {
  isAuthenticated?: boolean;
  onSuccess?: () => Promise<void> | void;
};

export function buildPlaceReviewAggregateInitialData(
  aggregate?: PlaceReviewAggregateSummary | null,
): PlaceReviewAggregate | undefined {
  if (!aggregate) {
    return undefined;
  }

  return {
    averageRating: aggregate.averageRating,
    reviewCount: aggregate.reviewCount,
    histogram: { ...EMPTY_REVIEW_HISTOGRAM },
  };
}

export function useQueryPlaceDetailReviewAggregate(
  placeId: string,
  options?: {
    initialData?: PlaceReviewAggregate;
    refetchOnMount?: boolean | "always";
    staleTime?: number;
  },
) {
  return trpc.placeReview.aggregate.useQuery(
    { placeId },
    {
      enabled: Boolean(placeId),
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

export function useQueryPlaceDetailReviews({
  placeId,
  limit,
  offset,
}: {
  placeId: string;
  limit: number;
  offset: number;
}) {
  return trpc.placeReview.list.useQuery(
    { placeId, limit, offset },
    { enabled: Boolean(placeId) },
  );
}

export function useQueryPlaceDetailViewerReview(
  placeId: string,
  options?: {
    enabled?: boolean;
  },
) {
  return trpc.placeReview.viewerReview.useQuery(
    { placeId },
    { enabled: Boolean(placeId) && (options?.enabled ?? true) },
  );
}

function useInvalidatePlaceDetailReviewQueries(
  placeId: string,
  isAuthenticated: boolean,
) {
  const utils = trpc.useUtils();

  return useCallback(async () => {
    await Promise.all([
      utils.placeReview.aggregate.invalidate({ placeId }),
      utils.placeReview.list.invalidate(),
      isAuthenticated
        ? utils.placeReview.viewerReview.invalidate({ placeId })
        : Promise.resolve(),
    ]);
  }, [isAuthenticated, placeId, utils]);
}

export function useMutPlaceDetailUpsertReview(
  placeId: string,
  options?: PlaceDetailReviewMutationOptions,
) {
  const invalidateReviewQueries = useInvalidatePlaceDetailReviewQueries(
    placeId,
    Boolean(options?.isAuthenticated),
  );

  return trpc.placeReview.upsert.useMutation({
    onSuccess: async () => {
      await invalidateReviewQueries();
      await options?.onSuccess?.();
    },
  });
}

export function useMutPlaceDetailRemoveReview(
  placeId: string,
  options?: PlaceDetailReviewMutationOptions,
) {
  const invalidateReviewQueries = useInvalidatePlaceDetailReviewQueries(
    placeId,
    Boolean(options?.isAuthenticated),
  );

  return trpc.placeReview.remove.useMutation({
    onSuccess: async () => {
      await invalidateReviewQueries();
      await options?.onSuccess?.();
    },
  });
}
