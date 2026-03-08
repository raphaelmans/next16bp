"use client";

import { useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { buildTrpcQueryKey } from "@/common/trpc-query-key";
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
  const queryClient = useQueryClient();

  const invalidateOwnerSetupStatus = React.useCallback(
    () =>
      queryClient.invalidateQueries({
        queryKey: buildTrpcQueryKey(["ownerSetup", "getStatus"]),
      }),
    [queryClient],
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
    (
      ...args: Parameters<typeof cache.courtBlock.listForCourtRange.invalidate>
    ) => cache.courtBlock.listForCourtRange.invalidate(...args),
    [cache],
  );

  const invalidateActiveReservationsForCourtRange = React.useCallback(
    (
      ...args: Parameters<
        typeof cache.reservationOwner.getActiveForCourtRange.invalidate
      >
    ) => cache.reservationOwner.getActiveForCourtRange.invalidate(...args),
    [cache],
  );

  const invalidateImportJob = React.useCallback(
    (...args: Parameters<typeof cache.bookingsImport.getJob.invalidate>) =>
      cache.bookingsImport.getJob.invalidate(...args),
    [cache],
  );

  const invalidateImportRows = React.useCallback(
    (...args: Parameters<typeof cache.bookingsImport.listRows.invalidate>) =>
      cache.bookingsImport.listRows.invalidate(...args),
    [cache],
  );

  const invalidateImportAiUsage = React.useCallback(
    (...args: Parameters<typeof cache.bookingsImport.aiUsage.invalidate>) =>
      cache.bookingsImport.aiUsage.invalidate(...args),
    [cache],
  );

  const invalidateImportRowsAndJob = React.useCallback(
    async (
      rowsArg: Parameters<typeof cache.bookingsImport.listRows.invalidate>[0],
      jobArg: Parameters<typeof cache.bookingsImport.getJob.invalidate>[0],
    ) =>
      Promise.all([
        cache.bookingsImport.listRows.invalidate(rowsArg),
        cache.bookingsImport.getJob.invalidate(jobArg),
      ]),
    [cache],
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
