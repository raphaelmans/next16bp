import { describe, expect, it } from "vitest";
import {
  deriveOwnerReservationNotificationRoutingState,
  shouldShowOwnerNotificationRoutingWarning,
} from "@/features/owner/domain";

describe("owner/domain", () => {
  describe("deriveOwnerReservationNotificationRoutingState", () => {
    const cases = [
      {
        label: "uses safe defaults when values are missing",
        input: {
          isPreferenceLoading: false,
          isRoutingStatusLoading: false,
          isSavingPreference: false,
        },
        expected: {
          enabled: false,
          canReceive: false,
          enabledRecipientCount: 0,
          busy: false,
          showPermissionHint: true,
          showMutedWarning: false,
        },
      },
      {
        label: "marks busy while any query or mutation is in flight",
        input: {
          enabled: true,
          canReceive: true,
          enabledRecipientCount: 2,
          isPreferenceLoading: false,
          isRoutingStatusLoading: true,
          isSavingPreference: false,
        },
        expected: {
          enabled: true,
          canReceive: true,
          enabledRecipientCount: 2,
          busy: true,
          showPermissionHint: false,
          showMutedWarning: false,
        },
      },
      {
        label:
          "shows muted warning when user can receive but no recipients are enabled",
        input: {
          enabled: true,
          canReceive: true,
          enabledRecipientCount: 0,
          isPreferenceLoading: false,
          isRoutingStatusLoading: false,
          isSavingPreference: false,
        },
        expected: {
          enabled: true,
          canReceive: true,
          enabledRecipientCount: 0,
          busy: false,
          showPermissionHint: false,
          showMutedWarning: true,
        },
      },
      {
        label: "does not show muted warning when user lacks receive permission",
        input: {
          enabled: false,
          canReceive: false,
          enabledRecipientCount: 0,
          isPreferenceLoading: false,
          isRoutingStatusLoading: false,
          isSavingPreference: false,
        },
        expected: {
          enabled: false,
          canReceive: false,
          enabledRecipientCount: 0,
          busy: false,
          showPermissionHint: true,
          showMutedWarning: false,
        },
      },
    ] as const;

    for (const { label, input, expected } of cases) {
      it(label, () => {
        expect(deriveOwnerReservationNotificationRoutingState(input)).toEqual(
          expected,
        );
      });
    }
  });

  describe("shouldShowOwnerNotificationRoutingWarning", () => {
    const cases = [
      {
        label: "returns false when organization is missing",
        input: {
          organizationId: null,
          canConfigureRouting: true,
          isRoutingStatusLoading: false,
          enabledRecipientCount: 0,
        },
        expected: false,
      },
      {
        label: "returns false while routing status is loading",
        input: {
          organizationId: "org-1",
          canConfigureRouting: true,
          isRoutingStatusLoading: true,
          enabledRecipientCount: 0,
        },
        expected: false,
      },
      {
        label:
          "returns true when org exists and enabled recipient count is zero",
        input: {
          organizationId: "org-1",
          canConfigureRouting: true,
          isRoutingStatusLoading: false,
          enabledRecipientCount: 0,
        },
        expected: true,
      },
      {
        label:
          "returns false when enabled recipient count is greater than zero",
        input: {
          organizationId: "org-1",
          canConfigureRouting: true,
          isRoutingStatusLoading: false,
          enabledRecipientCount: 2,
        },
        expected: false,
      },
      {
        label: "returns false when user cannot configure routing",
        input: {
          organizationId: "org-1",
          canConfigureRouting: false,
          isRoutingStatusLoading: false,
          enabledRecipientCount: 0,
        },
        expected: false,
      },
    ] as const;

    for (const { label, input, expected } of cases) {
      it(label, () => {
        expect(shouldShowOwnerNotificationRoutingWarning(input)).toBe(expected);
      });
    }
  });
});
