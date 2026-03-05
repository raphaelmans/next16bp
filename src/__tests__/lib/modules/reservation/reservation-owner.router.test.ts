import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotCourtOwnerError } from "@/lib/modules/court/errors/court.errors";
import { CourtBlockNotFoundError } from "@/lib/modules/court-block/errors/court-block.errors";
import { NotOrganizationOwnerError } from "@/lib/modules/organization/errors/organization.errors";
import {
  InvalidReservationStatusError,
  ReservationGroupNotFoundError,
  ReservationNotFoundError,
} from "@/lib/modules/reservation/errors/reservation.errors";

const TEST_IDS = {
  ownerUserId: "11111111-1111-4111-8111-111111111111",
  organizationId: "12121212-1212-4121-8121-121212121212",
  reservationGroupId: "22222222-2222-4222-8222-222222222222",
  reservationId: "33333333-3333-4333-8333-333333333333",
  courtId: "44444444-4444-4444-8444-444444444444",
  paymentMethodId: "55555555-5555-4555-8555-555555555555",
  guestProfileId: "66666666-6666-4666-8666-666666666666",
  blockId: "77777777-7777-4777-8777-777777777777",
};

const mockReservationOwnerService = {
  acceptReservation: vi.fn(),
  confirmPayment: vi.fn(),
  confirmPaidOffline: vi.fn(),
  rejectReservation: vi.fn(),
  cancelReservation: vi.fn(),
  createGuestBooking: vi.fn(),
  convertWalkInBlockToGuest: vi.fn(),
  getActiveForCourtRange: vi.fn(),
  getPendingForCourt: vi.fn(),
  getForOrganization: vi.fn(),
  getReservationLinkedDetail: vi.fn(),
  resolveLegacyReservationGroup: vi.fn(),
  getPendingCount: vi.fn(),
};

vi.mock("@/lib/modules/reservation/factories/reservation.factory", () => ({
  makeReservationOwnerService: () => mockReservationOwnerService,
}));

vi.mock("@/lib/shared/infra/ratelimit", () => ({
  getRateLimiter: () => ({
    limit: vi.fn(async () => ({ success: true, limit: 100, remaining: 99 })),
  }),
  RateLimiterUnavailableError: class extends Error {},
}));

import { reservationOwnerRouter } from "@/lib/modules/reservation/reservation-owner.router";

const createCaller = () =>
  reservationOwnerRouter.createCaller({
    requestId: "req-1",
    clientIdentifier: "client-1",
    clientIdentifierSource: "fallback",
    session: {
      userId: TEST_IDS.ownerUserId,
      email: "owner@example.com",
      role: "member",
    },
    userId: TEST_IDS.ownerUserId,
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
  } as unknown as Parameters<typeof reservationOwnerRouter.createCaller>[0]);

const hoursFromNowIso = (hours: number) =>
  new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

describe("reservationOwnerRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accept -> calls acceptReservation", async () => {
    const caller = createCaller();
    mockReservationOwnerService.acceptReservation.mockResolvedValue({
      id: TEST_IDS.reservationId,
      status: "AWAITING_PAYMENT",
    });

    await caller.accept({ reservationId: TEST_IDS.reservationId });

    expect(mockReservationOwnerService.acceptReservation).toHaveBeenCalledWith(
      TEST_IDS.ownerUserId,
      TEST_IDS.reservationId,
    );
  });

  it("confirmPayment -> calls confirmPayment", async () => {
    const caller = createCaller();
    mockReservationOwnerService.confirmPayment.mockResolvedValue({
      id: TEST_IDS.reservationId,
      status: "CONFIRMED",
    });

    await caller.confirmPayment({
      reservationId: TEST_IDS.reservationId,
      notes: "Receipt validated",
    });

    expect(mockReservationOwnerService.confirmPayment).toHaveBeenCalledWith(
      TEST_IDS.ownerUserId,
      {
        reservationId: TEST_IDS.reservationId,
        notes: "Receipt validated",
      },
    );
  });

  it("confirmPaidOffline -> calls confirmPaidOffline", async () => {
    const caller = createCaller();
    mockReservationOwnerService.confirmPaidOffline.mockResolvedValue({
      id: TEST_IDS.reservationId,
      status: "CONFIRMED",
    });

    await caller.confirmPaidOffline({
      reservationId: TEST_IDS.reservationId,
      paymentMethodId: TEST_IDS.paymentMethodId,
      paymentReference: "REF-123",
    });

    expect(mockReservationOwnerService.confirmPaidOffline).toHaveBeenCalledWith(
      TEST_IDS.ownerUserId,
      {
        reservationId: TEST_IDS.reservationId,
        paymentMethodId: TEST_IDS.paymentMethodId,
        paymentReference: "REF-123",
      },
    );
  });

  it("reject -> calls rejectReservation", async () => {
    const caller = createCaller();
    mockReservationOwnerService.rejectReservation.mockResolvedValue({
      id: TEST_IDS.reservationId,
      status: "CANCELLED",
    });

    await caller.reject({
      reservationId: TEST_IDS.reservationId,
      reason: "Schedule conflict",
    });

    expect(mockReservationOwnerService.rejectReservation).toHaveBeenCalledWith(
      TEST_IDS.ownerUserId,
      {
        reservationId: TEST_IDS.reservationId,
        reason: "Schedule conflict",
      },
    );
  });

  it("cancel -> calls cancelReservation", async () => {
    const caller = createCaller();
    mockReservationOwnerService.cancelReservation.mockResolvedValue({
      id: TEST_IDS.reservationId,
      status: "CANCELLED",
    });

    await caller.cancel({
      reservationId: TEST_IDS.reservationId,
      reason: "Owner cancellation",
    });

    expect(mockReservationOwnerService.cancelReservation).toHaveBeenCalledWith(
      TEST_IDS.ownerUserId,
      {
        reservationId: TEST_IDS.reservationId,
        reason: "Owner cancellation",
      },
    );
  });

  it("createGuestBooking -> calls createGuestBooking", async () => {
    const caller = createCaller();
    const input = {
      courtId: TEST_IDS.courtId,
      startTime: hoursFromNowIso(2),
      endTime: hoursFromNowIso(3),
      guestProfileId: TEST_IDS.guestProfileId,
      notes: "Walk-in confirmed",
    };
    mockReservationOwnerService.createGuestBooking.mockResolvedValue({
      id: TEST_IDS.reservationId,
      status: "CONFIRMED",
    });

    await caller.createGuestBooking(input);

    expect(mockReservationOwnerService.createGuestBooking).toHaveBeenCalledWith(
      TEST_IDS.ownerUserId,
      input,
    );
  });

  it("convertWalkInBlockToGuest -> calls convertWalkInBlockToGuest", async () => {
    const caller = createCaller();
    const input = {
      blockId: TEST_IDS.blockId,
      guestMode: "existing" as const,
      guestProfileId: TEST_IDS.guestProfileId,
      notes: "Converted walk-in",
    };
    mockReservationOwnerService.convertWalkInBlockToGuest.mockResolvedValue({
      id: TEST_IDS.reservationId,
      status: "CONFIRMED",
    });

    await caller.convertWalkInBlockToGuest(input);

    expect(
      mockReservationOwnerService.convertWalkInBlockToGuest,
    ).toHaveBeenCalledWith(TEST_IDS.ownerUserId, input);
  });

  it("getActiveForCourtRange -> calls getActiveForCourtRange", async () => {
    const caller = createCaller();
    const input = {
      courtId: TEST_IDS.courtId,
      startTime: hoursFromNowIso(1),
      endTime: hoursFromNowIso(4),
    };
    mockReservationOwnerService.getActiveForCourtRange.mockResolvedValue([]);

    const result = await caller.getActiveForCourtRange(input);

    expect(result).toEqual([]);
    expect(
      mockReservationOwnerService.getActiveForCourtRange,
    ).toHaveBeenCalledWith(TEST_IDS.ownerUserId, input);
  });

  it("getPendingForCourt -> calls getPendingForCourt", async () => {
    const caller = createCaller();
    mockReservationOwnerService.getPendingForCourt.mockResolvedValue([]);

    await caller.getPendingForCourt({ courtId: TEST_IDS.courtId });

    expect(mockReservationOwnerService.getPendingForCourt).toHaveBeenCalledWith(
      TEST_IDS.ownerUserId,
      TEST_IDS.courtId,
    );
  });

  it("getForOrganization -> calls getForOrganization", async () => {
    const caller = createCaller();
    const input = {
      organizationId: TEST_IDS.organizationId,
      status: "CREATED" as const,
      limit: 20,
      offset: 0,
    };
    mockReservationOwnerService.getForOrganization.mockResolvedValue([]);

    const result = await caller.getForOrganization(input);

    expect(result).toEqual([]);
    expect(mockReservationOwnerService.getForOrganization).toHaveBeenCalledWith(
      TEST_IDS.ownerUserId,
      input,
    );
  });

  it("getLinkedDetail -> calls getReservationLinkedDetail", async () => {
    const caller = createCaller();
    mockReservationOwnerService.getReservationLinkedDetail.mockResolvedValue({
      reservations: [],
    });

    const result = await caller.getLinkedDetail({
      reservationId: TEST_IDS.reservationId,
    });

    expect(result).toEqual({ reservations: [] });
    expect(
      mockReservationOwnerService.getReservationLinkedDetail,
    ).toHaveBeenCalledWith(TEST_IDS.ownerUserId, {
      reservationId: TEST_IDS.reservationId,
    });
  });

  it("resolveLegacyGroup -> calls resolveLegacyReservationGroup", async () => {
    const caller = createCaller();
    mockReservationOwnerService.resolveLegacyReservationGroup.mockResolvedValue(
      {
        reservationId: TEST_IDS.reservationId,
      },
    );

    const result = await caller.resolveLegacyGroup({
      reservationGroupId: TEST_IDS.reservationGroupId,
    });

    expect(result).toEqual({ reservationId: TEST_IDS.reservationId });
    expect(
      mockReservationOwnerService.resolveLegacyReservationGroup,
    ).toHaveBeenCalledWith(TEST_IDS.ownerUserId, {
      reservationGroupId: TEST_IDS.reservationGroupId,
    });
  });

  it("getPendingCount -> calls getPendingCount", async () => {
    const caller = createCaller();
    mockReservationOwnerService.getPendingCount.mockResolvedValue(3);

    const result = await caller.getPendingCount({
      organizationId: TEST_IDS.organizationId,
    });

    expect(result).toBe(3);
    expect(mockReservationOwnerService.getPendingCount).toHaveBeenCalledWith(
      TEST_IDS.ownerUserId,
      TEST_IDS.organizationId,
    );
  });

  it("accept forbidden -> maps to FORBIDDEN", async () => {
    const caller = createCaller();
    mockReservationOwnerService.acceptReservation.mockRejectedValue(
      new NotCourtOwnerError(),
    );

    await expect(
      caller.accept({ reservationId: TEST_IDS.reservationId }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("confirmPayment invalid status -> maps to BAD_REQUEST", async () => {
    const caller = createCaller();
    mockReservationOwnerService.confirmPayment.mockRejectedValue(
      new InvalidReservationStatusError(TEST_IDS.reservationId, "CREATED", [
        "PAYMENT_MARKED_BY_USER",
      ]),
    );

    await expect(
      caller.confirmPayment({
        reservationId: TEST_IDS.reservationId,
        notes: "Attempted confirmation",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("resolveLegacyGroup group not found -> maps to NOT_FOUND", async () => {
    const caller = createCaller();
    mockReservationOwnerService.resolveLegacyReservationGroup.mockRejectedValue(
      new ReservationGroupNotFoundError(TEST_IDS.reservationGroupId),
    );

    await expect(
      caller.resolveLegacyGroup({
        reservationGroupId: TEST_IDS.reservationGroupId,
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("convertWalkInBlockToGuest missing block -> maps to NOT_FOUND", async () => {
    const caller = createCaller();
    mockReservationOwnerService.convertWalkInBlockToGuest.mockRejectedValue(
      new CourtBlockNotFoundError(TEST_IDS.blockId),
    );

    await expect(
      caller.convertWalkInBlockToGuest({
        blockId: TEST_IDS.blockId,
        guestMode: "existing",
        guestProfileId: TEST_IDS.guestProfileId,
        notes: "Missing block",
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("getForOrganization not owner -> maps to FORBIDDEN", async () => {
    const caller = createCaller();
    mockReservationOwnerService.getForOrganization.mockRejectedValue(
      new NotOrganizationOwnerError(),
    );

    await expect(
      caller.getForOrganization({
        organizationId: TEST_IDS.organizationId,
        limit: 20,
        offset: 0,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("getLinkedDetail missing reservation -> maps to NOT_FOUND", async () => {
    const caller = createCaller();
    mockReservationOwnerService.getReservationLinkedDetail.mockRejectedValue(
      new ReservationNotFoundError(TEST_IDS.reservationId),
    );

    await expect(
      caller.getLinkedDetail({ reservationId: TEST_IDS.reservationId }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
