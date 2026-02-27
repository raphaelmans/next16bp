import { describe, expect, it } from "vitest";
import {
  deriveEnabledReservationNotificationUserIds,
  deriveReservationNotificationRoutingStatus,
} from "@/lib/modules/organization-member/shared/domain";

describe("organization-member/shared/domain", () => {
  describe("deriveEnabledReservationNotificationUserIds", () => {
    const cases: Array<{
      label: string;
      input: { eligibleUserIds: string[]; optedInUserIds: string[] };
      expected: string[];
    }> = [
      {
        label: "returns unique intersection preserving eligible-user ordering",
        input: {
          eligibleUserIds: [
            "owner-user-1",
            "manager-user-1",
            "manager-user-2",
            "manager-user-1",
          ],
          optedInUserIds: [
            "manager-user-2",
            "owner-user-1",
            "manager-user-2",
            "unknown-user",
          ],
        },
        expected: ["owner-user-1", "manager-user-2"],
      },
      {
        label: "returns empty array when no eligible users are provided",
        input: {
          eligibleUserIds: [],
          optedInUserIds: ["owner-user-1"],
        },
        expected: [],
      },
      {
        label: "returns empty array when no opted-in users are provided",
        input: {
          eligibleUserIds: ["owner-user-1", "manager-user-1"],
          optedInUserIds: [],
        },
        expected: [],
      },
    ];

    for (const { label, input, expected } of cases) {
      it(label, () => {
        expect(deriveEnabledReservationNotificationUserIds(input)).toEqual(
          expected,
        );
      });
    }
  });

  describe("deriveReservationNotificationRoutingStatus", () => {
    it("builds count and enabled flag from recipient ids", () => {
      expect(
        deriveReservationNotificationRoutingStatus("org-1", [
          "owner-user-1",
          "manager-user-2",
        ]),
      ).toEqual({
        organizationId: "org-1",
        enabledRecipientCount: 2,
        hasEnabledRecipients: true,
      });
    });

    it("marks hasEnabledRecipients false for empty recipient list", () => {
      expect(deriveReservationNotificationRoutingStatus("org-1", [])).toEqual({
        organizationId: "org-1",
        enabledRecipientCount: 0,
        hasEnabledRecipients: false,
      });
    });
  });
});
