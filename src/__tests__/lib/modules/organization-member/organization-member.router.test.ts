import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrganizationMemberPermissionDeniedError } from "@/lib/modules/organization-member/errors/organization-member.errors";

const TEST_IDS = {
  userId: "11111111-1111-4111-8111-111111111111",
  organizationId: "22222222-2222-4222-8222-222222222222",
};

const mockOrganizationMemberService = {
  listMembers: vi.fn(),
  listInvitations: vi.fn(),
  getMyPermissions: vi.fn(),
  inviteMember: vi.fn(),
  updateMemberPermissions: vi.fn(),
  revokeMember: vi.fn(),
  cancelInvitation: vi.fn(),
  acceptInvitation: vi.fn(),
  declineInvitation: vi.fn(),
  getMyReservationNotificationPreference: vi.fn(),
  setMyReservationNotificationPreference: vi.fn(),
  getReservationNotificationRoutingStatus: vi.fn(),
};

vi.mock(
  "@/lib/modules/organization-member/factories/organization-member.factory",
  () => ({
    makeOrganizationMemberService: () => mockOrganizationMemberService,
  }),
);

vi.mock("@/lib/shared/infra/ratelimit", () => ({
  getRateLimiter: () => ({
    limit: vi.fn(async () => ({ success: true, limit: 100, remaining: 99 })),
  }),
  RateLimiterUnavailableError: class extends Error {},
}));

import { organizationMemberRouter } from "@/lib/modules/organization-member/organization-member.router";

const createCaller = (sessionEmail = "manager@example.com") =>
  organizationMemberRouter.createCaller({
    requestId: "req-1",
    clientIdentifier: "client-1",
    clientIdentifierSource: "fallback",
    session: {
      userId: TEST_IDS.userId,
      email: sessionEmail,
      role: "member",
    },
    userId: TEST_IDS.userId,
    cookies: { getAll: () => [], setAll: () => undefined },
    origin: "http://localhost:3000",
    log: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      fatal: vi.fn(),
      trace: vi.fn(),
      silent: vi.fn(),
      level: "info",
      msgPrefix: "",
    } as unknown,
  } as unknown as Parameters<typeof organizationMemberRouter.createCaller>[0]);

describe("organizationMemberRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("invite calls service with user id and origin", async () => {
    const caller = createCaller();
    const input = {
      organizationId: TEST_IDS.organizationId,
      email: "staff@example.com",
      role: "MANAGER" as const,
      permissions: ["reservation.read"] as const,
    };

    mockOrganizationMemberService.inviteMember.mockResolvedValue({
      invitation: { id: "inv-1" },
      emailSent: true,
    });

    await caller.invite(input);

    expect(mockOrganizationMemberService.inviteMember).toHaveBeenCalledWith(
      TEST_IDS.userId,
      input,
      { origin: "http://localhost:3000" },
      undefined,
    );
  });

  it("list maps permission denied error to FORBIDDEN", async () => {
    const caller = createCaller();

    mockOrganizationMemberService.listMembers.mockRejectedValue(
      new OrganizationMemberPermissionDeniedError("organization.member.manage"),
    );

    await expect(
      caller.list({ organizationId: TEST_IDS.organizationId }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("acceptInvitation requires authenticated session email", async () => {
    const caller = createCaller("");

    await expect(
      caller.acceptInvitation({ token: "token-token-token-token" }),
    ).rejects.toBeInstanceOf(TRPCError);
    expect(
      mockOrganizationMemberService.acceptInvitation,
    ).not.toHaveBeenCalled();
  });

  it("acceptInvitation calls service with user and email", async () => {
    const caller = createCaller("manager@example.com");

    mockOrganizationMemberService.acceptInvitation.mockResolvedValue({
      id: "membership-1",
    });

    await caller.acceptInvitation({ token: "token-token-token-token" });

    expect(mockOrganizationMemberService.acceptInvitation).toHaveBeenCalledWith(
      TEST_IDS.userId,
      "manager@example.com",
      { token: "token-token-token-token" },
    );
  });

  it("getMyReservationNotificationPreference calls service", async () => {
    const caller = createCaller();
    mockOrganizationMemberService.getMyReservationNotificationPreference.mockResolvedValue(
      {
        organizationId: TEST_IDS.organizationId,
        userId: TEST_IDS.userId,
        enabled: false,
        canReceive: true,
      },
    );

    await caller.getMyReservationNotificationPreference({
      organizationId: TEST_IDS.organizationId,
    });

    expect(
      mockOrganizationMemberService.getMyReservationNotificationPreference,
    ).toHaveBeenCalledWith(TEST_IDS.userId, TEST_IDS.organizationId);
  });

  it("setMyReservationNotificationPreference calls service", async () => {
    const caller = createCaller();
    mockOrganizationMemberService.setMyReservationNotificationPreference.mockResolvedValue(
      {
        organizationId: TEST_IDS.organizationId,
        userId: TEST_IDS.userId,
        enabled: true,
        canReceive: true,
      },
    );

    await caller.setMyReservationNotificationPreference({
      organizationId: TEST_IDS.organizationId,
      enabled: true,
    });

    expect(
      mockOrganizationMemberService.setMyReservationNotificationPreference,
    ).toHaveBeenCalledWith(TEST_IDS.userId, {
      organizationId: TEST_IDS.organizationId,
      enabled: true,
    });
  });

  it("getReservationNotificationRoutingStatus calls service", async () => {
    const caller = createCaller();
    mockOrganizationMemberService.getReservationNotificationRoutingStatus.mockResolvedValue(
      {
        organizationId: TEST_IDS.organizationId,
        enabledRecipientCount: 0,
        hasEnabledRecipients: false,
      },
    );

    await caller.getReservationNotificationRoutingStatus({
      organizationId: TEST_IDS.organizationId,
    });

    expect(
      mockOrganizationMemberService.getReservationNotificationRoutingStatus,
    ).toHaveBeenCalledWith(TEST_IDS.userId, {
      organizationId: TEST_IDS.organizationId,
    });
  });
});
