export type OwnerReservationNotificationRoutingStateInput = {
  enabled?: boolean | null;
  canReceive?: boolean | null;
  enabledRecipientCount?: number | null;
  isPreferenceLoading: boolean;
  isRoutingStatusLoading: boolean;
  isSavingPreference: boolean;
};

export type OwnerReservationNotificationRoutingState = {
  enabled: boolean;
  canReceive: boolean;
  enabledRecipientCount: number;
  busy: boolean;
  showPermissionHint: boolean;
  showMutedWarning: boolean;
};

/**
 * Derives settings-screen notification routing state from query/mutation inputs.
 */
export function deriveOwnerReservationNotificationRoutingState(
  input: OwnerReservationNotificationRoutingStateInput,
): OwnerReservationNotificationRoutingState {
  const enabled = input.enabled ?? false;
  const canReceive = input.canReceive ?? false;
  const enabledRecipientCount = Math.max(0, input.enabledRecipientCount ?? 0);
  const busy =
    input.isPreferenceLoading ||
    input.isRoutingStatusLoading ||
    input.isSavingPreference;

  return {
    enabled,
    canReceive,
    enabledRecipientCount,
    busy,
    showPermissionHint: !canReceive,
    showMutedWarning: canReceive && enabledRecipientCount === 0,
  };
}

export type OwnerDashboardNotificationRoutingWarningInput = {
  organizationId?: string | null;
  canConfigureRouting: boolean;
  isRoutingStatusLoading: boolean;
  enabledRecipientCount?: number | null;
};

export function shouldShowOwnerNotificationRoutingWarning(
  input: OwnerDashboardNotificationRoutingWarningInput,
): boolean {
  return Boolean(
    input.organizationId &&
      input.canConfigureRouting &&
      !input.isRoutingStatusLoading &&
      (input.enabledRecipientCount ?? 0) === 0,
  );
}
