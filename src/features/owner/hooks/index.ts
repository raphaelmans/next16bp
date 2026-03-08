"use client";

import * as React from "react";
import { useFeatureQueryCache } from "@/common/feature-api-hooks";
import { trpc } from "@/trpc/client";

export * from "./analytics";
export * from "./availability-sync";
export * from "./bookings-import";
export * from "./court-addons";
export * from "./court-hours";
export * from "./court-pricing";
export * from "./courts";
export * from "./organization";
export * from "./place-addons";
export * from "./place-verification";
export * from "./places";
export * from "./reservations";

export function useModOwnerInvalidation() {
  const cache = trpc.useUtils();
  const featureCache = useFeatureQueryCache();

  const invalidateOwnerSetupStatus = React.useCallback(
    () => featureCache.invalidate(["ownerSetup", "getStatus"]),
    [featureCache],
  );

  const invalidateClaimRequestMine = React.useCallback(
    (...args: Parameters<typeof cache.claimRequest.getMy.invalidate>) =>
      cache.claimRequest.getMy.invalidate(...args),
    [cache],
  );

  const invalidatePlaceManagementList = React.useCallback(
    (...args: Parameters<typeof cache.placeManagement.list.invalidate>) =>
      cache.placeManagement.list.invalidate(...args),
    [cache],
  );

  const invalidatePlaceManagementAll = React.useCallback(
    (...args: Parameters<typeof cache.placeManagement.invalidate>) =>
      cache.placeManagement.invalidate(...args),
    [cache],
  );

  const invalidateOwnerReservationsOverview = React.useCallback(
    async (sessionArg?: { reservationId?: string }) =>
      Promise.all([
        cache.reservationOwner.getForOrganization.invalidate(),
        cache.reservationOwner.getPendingCount.invalidate(),
        cache.reservationChat.getThreadMetas.invalidate(),
        sessionArg
          ? cache.reservationChat.getSession.invalidate(sessionArg)
          : cache.reservationChat.getSession.invalidate(),
      ]),
    [cache],
  );

  const invalidateCourtBlocksRange = React.useCallback(
    (input?: Record<string, unknown>) =>
      featureCache.invalidate(["courtBlock", "listForCourtRange"], input),
    [featureCache],
  );

  const invalidateActiveReservationsForCourtRange = React.useCallback(
    (input?: Record<string, unknown>) =>
      featureCache.invalidate(
        ["reservationOwner", "getActiveForCourtRange"],
        input,
      ),
    [featureCache],
  );

  const invalidateImportJob = React.useCallback(
    (input?: Record<string, unknown>) =>
      featureCache.invalidate(["bookingsImport", "getJob"], input),
    [featureCache],
  );

  const invalidateImportRows = React.useCallback(
    (input?: Record<string, unknown>) =>
      featureCache.invalidate(["bookingsImport", "listRows"], input),
    [featureCache],
  );

  const invalidateImportAiUsage = React.useCallback(
    (input?: Record<string, unknown>) =>
      featureCache.invalidate(["bookingsImport", "aiUsage"], input),
    [featureCache],
  );

  const invalidateImportRowsAndJob = React.useCallback(
    async (
      rowsInput?: Record<string, unknown>,
      jobInput?: Record<string, unknown>,
    ) =>
      Promise.all([
        featureCache.invalidate(["bookingsImport", "listRows"], rowsInput),
        featureCache.invalidate(["bookingsImport", "getJob"], jobInput),
      ]),
    [featureCache],
  );

  return {
    invalidateOwnerSetupStatus,
    invalidateClaimRequestMine,
    invalidatePlaceManagementList,
    invalidatePlaceManagementAll,
    invalidateOwnerReservationsOverview,
    invalidateCourtBlocksRange,
    invalidateActiveReservationsForCourtRange,
    invalidateImportJob,
    invalidateImportRows,
    invalidateImportAiUsage,
    invalidateImportRowsAndJob,
  };
}
