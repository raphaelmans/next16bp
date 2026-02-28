import { beforeEach, describe, expect, it, vi } from "vitest";

const mockOwnerSetupStatusUseCase = {
  execute: vi.fn(),
};

vi.mock("@/lib/modules/owner-setup/factories/owner-setup.factory", () => ({
  makeOwnerSetupStatusUseCase: () => mockOwnerSetupStatusUseCase,
}));

import { ownerSetupRouter } from "@/lib/modules/owner-setup/owner-setup.router";

const createCaller = () =>
  ownerSetupRouter.createCaller({
    requestId: "req-1",
    clientIdentifier: "client-1",
    clientIdentifierSource: "fallback",
    session: { userId: "owner-1", email: "owner@example.com", role: "member" },
    userId: "owner-1",
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
  } as unknown as Parameters<typeof ownerSetupRouter.createCaller>[0]);

describe("ownerSetupRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getStatus -> delegates to use case with current user id", async () => {
    // Arrange
    const caller = createCaller();
    const statusPayload = {
      hasOrganization: true,
      organization: { id: "org-1", name: "Org 1" },
      hasPendingClaim: false,
      hasVenue: true,
      hasAnyConfiguredVenue: true,
      primaryPlace: { id: "place-1", name: "Main Place" },
      verificationStatus: "VERIFIED",
      hasVerification: true,
      hasActiveCourt: true,
      hasReadyCourt: true,
      hasCourtSchedule: true,
      hasCourtPricing: true,
      hasPaymentMethod: true,
      primaryCourtId: "court-1",
      readyCourtId: "court-1",
      isSetupComplete: true,
      nextStep: "complete",
    };
    mockOwnerSetupStatusUseCase.execute.mockResolvedValue(statusPayload);

    // Act
    const result = await caller.getStatus();

    // Assert
    expect(result).toEqual(statusPayload);
    expect(mockOwnerSetupStatusUseCase.execute).toHaveBeenCalledWith("owner-1");
  });

  it("getStatus use-case failure -> propagates error", async () => {
    // Arrange
    const caller = createCaller();
    mockOwnerSetupStatusUseCase.execute.mockRejectedValue(
      new Error("setup-status-failed"),
    );

    // Act + Assert
    await expect(caller.getStatus()).rejects.toThrow("setup-status-failed");
  });
});
