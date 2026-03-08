"use client";

import { createContext, useContext } from "react";
import {
  buildPlaceReviewAggregateInitialData,
  type PlaceReviewAggregate,
  type PlaceReviewAggregateSummary,
  useQueryPlaceDetailReviewAggregate,
} from "@/features/discovery/place-detail/hooks/use-place-detail-reviews";

type PlaceDetailReviewAggregateContextValue = {
  aggregate: PlaceReviewAggregate | undefined;
  isLoading: boolean;
};

const PlaceDetailReviewAggregateContext =
  createContext<PlaceDetailReviewAggregateContextValue | null>(null);

type PlaceDetailReviewAggregateProviderProps = {
  children: React.ReactNode;
  initialReviewAggregate: PlaceReviewAggregateSummary | null;
  placeId: string;
};

export function PlaceDetailReviewAggregateProvider({
  children,
  initialReviewAggregate,
  placeId,
}: PlaceDetailReviewAggregateProviderProps) {
  const aggregateQuery = useQueryPlaceDetailReviewAggregate(placeId, {
    initialData: buildPlaceReviewAggregateInitialData(initialReviewAggregate),
    refetchOnMount: "always",
    staleTime: 0,
  });

  return (
    <PlaceDetailReviewAggregateContext.Provider
      value={{
        aggregate: aggregateQuery.data,
        isLoading: aggregateQuery.isLoading,
      }}
    >
      {children}
    </PlaceDetailReviewAggregateContext.Provider>
  );
}

export function usePlaceDetailReviewAggregateContext() {
  const context = useContext(PlaceDetailReviewAggregateContext);

  if (!context) {
    throw new Error(
      "usePlaceDetailReviewAggregateContext must be used within PlaceDetailReviewAggregateProvider",
    );
  }

  return context;
}
