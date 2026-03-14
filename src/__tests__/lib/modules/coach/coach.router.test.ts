import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CoachNotActiveError,
  CoachNotFoundError,
  CoachSlugConflictError,
} from "@/lib/modules/coach/errors/coach.errors";

const TEST_IDS = {
  userId: "11111111-1111-4111-8111-111111111111",
  coachId: "22222222-2222-4222-8222-222222222222",
};

const mockCoachService = {
  getCoachByUserId: vi.fn(),
  updateCoach: vi.fn(),
  createCoach: vi.fn(),
  deactivateCoach: vi.fn(),
};

const mockCoachDiscoveryService = {
  listCoachSummaries: vi.fn(),
  listCoachCardMediaByIds: vi.fn(),
  listCoachCardMetaByIds: vi.fn(),
  getCoachByIdOrSlug: vi.fn(),
  getPublicStats: vi.fn(),
};

const mockCoachSetupStatusUseCase = {
  execute: vi.fn(),
};

vi.mock("@/lib/modules/coach/factories/coach.factory", () => ({
  makeCoachService: () => mockCoachService,
  makeCoachDiscoveryService: () => mockCoachDiscoveryService,
}));

vi.mock("@/lib/modules/coach-setup/factories/coach-setup.factory", () => ({
  makeCoachSetupStatusUseCase: () => mockCoachSetupStatusUseCase,
}));

import { coachRouter } from "@/lib/modules/coach/coach.router";

const createProtectedCaller = () =>
  coachRouter.createCaller({
    requestId: "req-1",
    clientIdentifier: "client-1",
    clientIdentifierSource: "fallback",
    session: {
      userId: TEST_IDS.userId,
      email: "coach@example.com",
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
  } as unknown as Parameters<typeof coachRouter.createCaller>[0]);

const createPublicCaller = () =>
  coachRouter.createCaller({
    requestId: "req-public",
    clientIdentifier: "client-public",
    clientIdentifierSource: "fallback",
    session: null,
    userId: null,
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
  } as unknown as Parameters<typeof coachRouter.createCaller>[0]);

describe("coachRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listSummary exposes public discovery results", async () => {
    const caller = createPublicCaller();
    const payload = {
      items: [
        {
          coach: {
            id: TEST_IDS.coachId,
            slug: "coach-alex",
            name: "Coach Alex",
            tagline: "Elite private lessons",
            city: "Cebu City",
            province: "Cebu",
            baseHourlyRateCents: 1500,
            baseHourlyRateCurrency: "PHP",
            featuredRank: 0,
            provinceRank: 0,
          },
          meta: {
            sports: [],
            sessionTypes: ["PRIVATE"],
            averageRating: 4.8,
            reviewCount: 12,
            verified: true,
          },
        },
      ],
      total: 1,
    };
    mockCoachDiscoveryService.listCoachSummaries.mockResolvedValue(payload);

    const result = await caller.listSummary({ limit: 20, offset: 0 });

    expect(result).toEqual(payload);
    expect(mockCoachDiscoveryService.listCoachSummaries).toHaveBeenCalledWith({
      limit: 20,
      offset: 0,
    });
  });

  it("getByIdOrSlug maps inactive coaches to NOT_FOUND", async () => {
    const caller = createPublicCaller();
    mockCoachDiscoveryService.getCoachByIdOrSlug.mockRejectedValue(
      new CoachNotActiveError(TEST_IDS.coachId),
    );

    await expect(
      caller.getByIdOrSlug({ coachIdOrSlug: "coach-alex" }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("stats returns public coach metrics", async () => {
    const caller = createPublicCaller();
    const payload = { totalCoaches: 9, totalCities: 4, totalSports: 3 };
    mockCoachDiscoveryService.getPublicStats.mockResolvedValue(payload);

    const result = await caller.stats();

    expect(result).toEqual(payload);
    expect(mockCoachDiscoveryService.getPublicStats).toHaveBeenCalledOnce();
  });

  it("getMyProfile returns the current coach profile payload", async () => {
    const caller = createProtectedCaller();
    const details = {
      coach: {
        id: TEST_IDS.coachId,
        userId: TEST_IDS.userId,
        name: "Coach Alex",
      },
      contactDetail: null,
      sports: [],
      certifications: [],
      specialties: [],
      skillLevels: [],
      ageGroups: [],
      sessionTypes: [],
      sessionDurations: [],
      photos: [],
    };
    mockCoachService.getCoachByUserId.mockResolvedValue(details);

    const result = await caller.getMyProfile();

    expect(result).toEqual(details);
    expect(mockCoachService.getCoachByUserId).toHaveBeenCalledWith(
      TEST_IDS.userId,
    );
  });

  it("getSetupStatus returns the current coach setup state", async () => {
    const caller = createProtectedCaller();
    const status = {
      coachId: TEST_IDS.coachId,
      hasCoachProfile: true,
      hasCoachSports: true,
      hasCoachLocation: false,
      hasCoachSchedule: false,
      hasCoachPricing: false,
      hasPaymentMethod: false,
      hasVerification: true,
      isSetupComplete: false,
      nextStep: "location",
    };
    mockCoachSetupStatusUseCase.execute.mockResolvedValue(status);

    const result = await caller.getSetupStatus();

    expect(result).toEqual(status);
    expect(mockCoachSetupStatusUseCase.execute).toHaveBeenCalledWith(
      TEST_IDS.userId,
    );
  });

  it("updateProfile passes the payload to the service", async () => {
    const caller = createProtectedCaller();
    const payload = { name: "Coach Alex", sportIds: [] as string[] };
    mockCoachService.updateCoach.mockResolvedValue({
      coach: {
        id: TEST_IDS.coachId,
        userId: TEST_IDS.userId,
        name: "Coach Alex",
      },
    });

    const result = await caller.updateProfile(payload);

    expect(result).toMatchObject({
      coach: {
        id: TEST_IDS.coachId,
        name: "Coach Alex",
      },
    });
    expect(mockCoachService.updateCoach).toHaveBeenCalledWith(
      TEST_IDS.userId,
      expect.objectContaining({
        name: "Coach Alex",
        sportIds: [],
        certifications: [],
        specialties: [],
        skillLevels: [],
        ageGroups: [],
        sessionTypes: [],
        sessionDurations: [],
      }),
    );
  });

  it("updateProfile maps coach slug conflicts to CONFLICT", async () => {
    const caller = createProtectedCaller();
    mockCoachService.updateCoach.mockRejectedValue(
      new CoachSlugConflictError("coach-alex"),
    );

    await expect(
      caller.updateProfile({ name: "Coach Alex" }),
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });

  it("getMyProfile maps missing coach errors to NOT_FOUND", async () => {
    const caller = createProtectedCaller();
    mockCoachService.getCoachByUserId.mockRejectedValue(
      new CoachNotFoundError(TEST_IDS.userId),
    );

    await expect(caller.getMyProfile()).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});
