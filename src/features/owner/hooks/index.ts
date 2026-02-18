"use client";

import * as React from "react";
import { trpc } from "@/trpc/client";

export * from "./bookings-import";
export * from "./court-hours";
export * from "./court-pricing";
export * from "./courts";
export * from "./organization";
export * from "./place-verification";
export * from "./places";
export * from "./reservations";

export function useModOwnerInvalidation() {
  const cache = trpc.useUtils();

  const invalidateOwnerSetupStatus = React.useCallback(
    (...args: Parameters<typeof cache.ownerSetup.getStatus.invalidate>) =>
      cache.ownerSetup.getStatus.invalidate(...args),
    [cache],
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
    async (
      ...sessionArgs: Parameters<
        typeof cache.reservationChat.getSession.invalidate
      >
    ) =>
      Promise.all([
        cache.reservationOwner.getForOrganization.invalidate(),
        cache.reservationOwner.getPendingCount.invalidate(),
        cache.reservationChat.getThreadMetas.invalidate(),
        ...sessionArgs.map((arg) =>
          cache.reservationChat.getSession.invalidate(arg),
        ),
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
