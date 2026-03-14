import { beforeEach, describe, expect, it, vi } from "vitest";
import {
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

vi.mock("@/lib/modules/coach/factories/coach.factory", () => ({
  makeCoachService: () => mockCoachService,
}));

import { coachRouter } from "@/lib/modules/coach/coach.router";

const createCaller = () =>
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

describe("coachRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getMyProfile returns the current coach profile payload", async () => {
    const caller = createCaller();
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

  it("updateProfile passes the payload to the service", async () => {
    const caller = createCaller();
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
    const caller = createCaller();
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
    const caller = createCaller();
    mockCoachService.getCoachByUserId.mockRejectedValue(
      new CoachNotFoundError(TEST_IDS.userId),
    );

    await expect(caller.getMyProfile()).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});
