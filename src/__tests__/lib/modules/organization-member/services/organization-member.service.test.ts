import { describe, expect, it, vi } from "vitest";
import type { IOrganizationRepository } from "@/lib/modules/organization/repositories/organization.repository";
import { OrganizationMemberPermissionDeniedError } from "@/lib/modules/organization-member/errors/organization-member.errors";
import type { IOrganizationMemberRepository } from "@/lib/modules/organization-member/repositories/organization-member.repository";
import { OrganizationMemberService } from "@/lib/modules/organization-member/services/organization-member.service";
import type {
  OrganizationMemberRecord,
  OrganizationRecord,
} from "@/lib/shared/infra/db/schema";

const now = new Date("2026-02-27T00:00:00.000Z");

const makeOrganization = (ownerUserId: string): OrganizationRecord => ({
  id: "org-1",
  ownerUserId,
  name: "Test Organization",
  slug: "test-organization",
  isActive: true,
  createdAt: now,
  updatedAt: now,
});

const makeMembership = (
  overrides: Partial<OrganizationMemberRecord> = {},
): OrganizationMemberRecord => ({
  id: "membership-1",
  organizationId: "org-1",
  userId: "member-user-1",
  role: "MANAGER",
  permissions: ["reservation.read", "reservation.chat"],
  status: "ACTIVE",
  invitedByUserId: "owner-user-1",
  joinedAt: now,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

function makeService(options?: {
  ownerUserId?: string;
  membership?: OrganizationMemberRecord | null;
  userIdsWithPermission?: string[];
  notificationPreference?: { reservationOpsEnabled: boolean } | null;
  enabledNotificationUserIds?: string[];
}) {
  const organizationRepository = {
    findById: vi
      .fn()
      .mockResolvedValue(
        makeOrganization(options?.ownerUserId ?? "owner-user-1"),
      ),
  } as unknown as IOrganizationRepository;

  const organizationMemberRepository = {
    findActiveMembership: vi
      .fn()
      .mockResolvedValue(options?.membership ?? null),
    listActiveUserIdsByOrganizationPermission: vi
      .fn()
      .mockResolvedValue(options?.userIdsWithPermission ?? []),
    findReservationNotificationPreference: vi
      .fn()
      .mockResolvedValue(options?.notificationPreference ?? null),
    upsertReservationNotificationPreference: vi
      .fn()
      .mockImplementation(
        async ({
          organizationId,
          userId,
          reservationOpsEnabled,
        }: {
          organizationId: string;
          userId: string;
          reservationOpsEnabled: boolean;
        }) => ({
          id: "pref-1",
          organizationId,
          userId,
          reservationOpsEnabled,
          createdAt: now,
          updatedAt: now,
        }),
      ),
    listReservationNotificationEnabledUserIds: vi
      .fn()
      .mockResolvedValue(options?.enabledNotificationUserIds ?? []),
  } as unknown as IOrganizationMemberRepository;

  const emailService = {
    sendEmail: vi.fn(),
  };

  const transactionManager = {
    run: vi.fn(async (work: (tx: object) => unknown) => work({})),
  };

  const service = new OrganizationMemberService(
    organizationMemberRepository,
    organizationRepository,
    emailService as never,
    transactionManager as never,
  );

  return {
    service,
    organizationRepository,
    organizationMemberRepository,
  };
}

describe("OrganizationMemberService authorization", () => {
  it("owner has implicit organization permissions", async () => {
    const { service, organizationMemberRepository } = makeService({
      ownerUserId: "owner-user-1",
    });

    const allowed = await service.hasOrganizationPermission(
      "owner-user-1",
      "org-1",
      "reservation.chat",
    );

    expect(allowed).toBe(true);
    expect(
      vi.mocked(organizationMemberRepository.findActiveMembership),
    ).not.toHaveBeenCalled();
  });

  it("active member with required permission is allowed", async () => {
    const { service } = makeService({
      membership: makeMembership({
        userId: "manager-user-1",
        permissions: ["reservation.read", "reservation.update_status"],
      }),
    });

    const allowed = await service.hasOrganizationPermission(
      "manager-user-1",
      "org-1",
      "reservation.update_status",
    );

    expect(allowed).toBe(true);
  });

  it("active member without required permission is denied", async () => {
    const { service } = makeService({
      membership: makeMembership({
        userId: "viewer-user-1",
        role: "VIEWER",
        permissions: ["reservation.read"],
      }),
    });

    const allowed = await service.hasOrganizationPermission(
      "viewer-user-1",
      "org-1",
      "reservation.update_status",
    );

    expect(allowed).toBe(false);
  });

  it("assertOrganizationPermission throws when permission is missing", async () => {
    const { service } = makeService({
      membership: makeMembership({
        userId: "viewer-user-1",
        role: "VIEWER",
        permissions: ["reservation.read"],
      }),
    });

    await expect(
      service.assertOrganizationPermission(
        "viewer-user-1",
        "org-1",
        "reservation.chat",
      ),
    ).rejects.toBeInstanceOf(OrganizationMemberPermissionDeniedError);
  });

  it("listOrganizationUserIdsWithPermission returns owner and authorized members", async () => {
    const { service } = makeService({
      ownerUserId: "owner-user-1",
      userIdsWithPermission: ["manager-user-1", "manager-user-2"],
    });

    const userIds = await service.listOrganizationUserIdsWithPermission(
      "org-1",
      "reservation.read",
    );

    expect(userIds).toEqual([
      "owner-user-1",
      "manager-user-1",
      "manager-user-2",
    ]);
  });

  it("getMyReservationNotificationPreference returns opt-in state and eligibility", async () => {
    const { service } = makeService({
      ownerUserId: "owner-user-1",
      notificationPreference: { reservationOpsEnabled: true },
    });

    const result = await service.getMyReservationNotificationPreference(
      "owner-user-1",
      "org-1",
    );

    expect(result).toEqual({
      organizationId: "org-1",
      userId: "owner-user-1",
      enabled: true,
      canReceive: true,
    });
  });

  it("setMyReservationNotificationPreference enforces permission gate", async () => {
    const { service } = makeService({
      membership: makeMembership({
        userId: "viewer-user-1",
        role: "VIEWER",
        permissions: ["reservation.read"],
      }),
    });

    await expect(
      service.setMyReservationNotificationPreference("viewer-user-1", {
        organizationId: "org-1",
        enabled: true,
      }),
    ).rejects.toBeInstanceOf(OrganizationMemberPermissionDeniedError);
  });

  it("setMyReservationNotificationPreference persists preference for eligible member", async () => {
    const { service, organizationMemberRepository } = makeService({
      ownerUserId: "owner-user-1",
    });

    const result = await service.setMyReservationNotificationPreference(
      "owner-user-1",
      {
        organizationId: "org-1",
        enabled: false,
      },
    );

    expect(result).toEqual({
      organizationId: "org-1",
      userId: "owner-user-1",
      enabled: false,
      canReceive: true,
    });
    expect(
      vi.mocked(
        organizationMemberRepository.upsertReservationNotificationPreference,
      ),
    ).toHaveBeenCalledWith(
      {
        organizationId: "org-1",
        userId: "owner-user-1",
        reservationOpsEnabled: false,
      },
      undefined,
    );
  });

  it("getReservationNotificationRoutingStatus enforces reservation.read permission", async () => {
    const { service } = makeService({
      ownerUserId: "owner-user-1",
      membership: null,
    });

    await expect(
      service.getReservationNotificationRoutingStatus("non-member-user-1", {
        organizationId: "org-1",
      }),
    ).rejects.toBeInstanceOf(OrganizationMemberPermissionDeniedError);
  });

  it("getReservationNotificationRoutingStatus returns count and hasEnabledRecipients", async () => {
    const { service } = makeService({
      ownerUserId: "owner-user-1",
      userIdsWithPermission: ["manager-user-1"],
      enabledNotificationUserIds: ["manager-user-1"],
    });

    const status = await service.getReservationNotificationRoutingStatus(
      "owner-user-1",
      {
        organizationId: "org-1",
      },
    );

    expect(status).toEqual({
      organizationId: "org-1",
      enabledRecipientCount: 1,
      hasEnabledRecipients: true,
    });
  });

  it("listOrganizationUserIdsForReservationNotifications returns opted-in eligible users only", async () => {
    const { service, organizationMemberRepository } = makeService({
      ownerUserId: "owner-user-1",
      userIdsWithPermission: ["manager-user-1", "manager-user-2"],
      enabledNotificationUserIds: ["manager-user-2"],
    });

    const userIds =
      await service.listOrganizationUserIdsForReservationNotifications("org-1");

    expect(userIds).toEqual(["manager-user-2"]);
    expect(
      vi.mocked(
        organizationMemberRepository.listReservationNotificationEnabledUserIds,
      ),
    ).toHaveBeenCalledWith(
      "org-1",
      ["owner-user-1", "manager-user-1", "manager-user-2"],
      undefined,
    );
  });

  it("listOrganizationUserIdsForReservationNotifications removes duplicates and non-eligible users", async () => {
    const { service } = makeService({
      ownerUserId: "owner-user-1",
      userIdsWithPermission: ["manager-user-1", "manager-user-2"],
      enabledNotificationUserIds: [
        "manager-user-2",
        "owner-user-1",
        "manager-user-2",
        "unknown-user",
      ],
    });

    const userIds =
      await service.listOrganizationUserIdsForReservationNotifications("org-1");

    expect(userIds).toEqual(["owner-user-1", "manager-user-2"]);
  });
});
