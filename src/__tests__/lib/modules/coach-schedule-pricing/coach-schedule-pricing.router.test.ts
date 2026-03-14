import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CoachNotFoundError,
  CoachOwnershipError,
} from "@/lib/modules/coach/errors/coach.errors";
import { coachAddonRouter } from "@/lib/modules/coach-addon/coach-addon.router";
import { coachBlockRouter } from "@/lib/modules/coach-block/coach-block.router";
import { CoachBlockNotFoundError } from "@/lib/modules/coach-block/errors/coach-block.errors";
import { coachHoursRouter } from "@/lib/modules/coach-hours/coach-hours.router";
import { coachRateRuleRouter } from "@/lib/modules/coach-rate-rule/coach-rate-rule.router";

const TEST_IDS = {
  userId: "11111111-1111-4111-8111-111111111111",
  coachId: "22222222-2222-4222-8222-222222222222",
  blockId: "33333333-3333-4333-8333-333333333333",
};

const mockCoachHoursService = {
  getHours: vi.fn(),
  setHours: vi.fn(),
};

const mockCoachRateRuleService = {
  getRules: vi.fn(),
  setRules: vi.fn(),
};

const mockCoachAddonService = {
  getByCoach: vi.fn(),
  setForCoach: vi.fn(),
};

const mockCoachBlockService = {
  list: vi.fn(),
  create: vi.fn(),
  delete: vi.fn(),
};

vi.mock("@/lib/modules/coach-hours/factories/coach-hours.factory", () => ({
  makeCoachHoursService: () => mockCoachHoursService,
}));

vi.mock(
  "@/lib/modules/coach-rate-rule/factories/coach-rate-rule.factory",
  () => ({
    makeCoachRateRuleService: () => mockCoachRateRuleService,
  }),
);

vi.mock("@/lib/modules/coach-addon/factories/coach-addon.factory", () => ({
  makeCoachAddonService: () => mockCoachAddonService,
}));

vi.mock("@/lib/modules/coach-block/factories/coach-block.factory", () => ({
  makeCoachBlockService: () => mockCoachBlockService,
}));

const createContext = () =>
  ({
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
  }) as Parameters<typeof coachHoursRouter.createCaller>[0];

describe("coach schedule/pricing routers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("coachHours.get calls the hours service", async () => {
    const caller = coachHoursRouter.createCaller(createContext());
    mockCoachHoursService.getHours.mockResolvedValue([
      {
        id: "hours-1",
        coachId: TEST_IDS.coachId,
        dayOfWeek: 1,
        startMinute: 540,
        endMinute: 660,
        isAvailable: true,
        createdAt: new Date("2026-03-14T00:00:00.000Z"),
        updatedAt: new Date("2026-03-14T00:00:00.000Z"),
      },
    ]);

    const result = await caller.get({ coachId: TEST_IDS.coachId });

    expect(result).toHaveLength(1);
    expect(mockCoachHoursService.getHours).toHaveBeenCalledWith(
      TEST_IDS.userId,
      TEST_IDS.coachId,
    );
  });

  it("coachRateRule.get redacts currency fields", async () => {
    const caller = coachRateRuleRouter.createCaller(createContext());
    mockCoachRateRuleService.getRules.mockResolvedValue([
      {
        id: "rule-1",
        coachId: TEST_IDS.coachId,
        dayOfWeek: 2,
        startMinute: 480,
        endMinute: 600,
        hourlyRateCents: 1500,
        currency: "PHP",
        createdAt: new Date("2026-03-14T00:00:00.000Z"),
        updatedAt: new Date("2026-03-14T00:00:00.000Z"),
      },
    ]);

    const result = await caller.get({ coachId: TEST_IDS.coachId });

    expect(result).toEqual([
      expect.objectContaining({
        id: "rule-1",
        hourlyRateCents: 1500,
      }),
    ]);
    expect(result[0]).not.toHaveProperty("currency");
  });

  it("coachAddon.get redacts addon and rule currencies", async () => {
    const caller = coachAddonRouter.createCaller(createContext());
    mockCoachAddonService.getByCoach.mockResolvedValue([
      {
        addon: {
          id: "addon-1",
          coachId: TEST_IDS.coachId,
          label: "Video review",
          isActive: true,
          mode: "OPTIONAL",
          pricingType: "FLAT",
          flatFeeCents: 300,
          flatFeeCurrency: "PHP",
          displayOrder: 0,
          createdAt: new Date("2026-03-14T00:00:00.000Z"),
          updatedAt: new Date("2026-03-14T00:00:00.000Z"),
        },
        rules: [
          {
            id: "addon-rule-1",
            addonId: "addon-1",
            dayOfWeek: 1,
            startMinute: 540,
            endMinute: 600,
            hourlyRateCents: 200,
            currency: "PHP",
            createdAt: new Date("2026-03-14T00:00:00.000Z"),
          },
        ],
      },
    ]);

    const result = await caller.get({ coachId: TEST_IDS.coachId });

    expect(result[0]?.addon).not.toHaveProperty("flatFeeCurrency");
    expect(result[0]?.rules[0]).not.toHaveProperty("currency");
  });

  it("coachBlock.delete returns a success envelope", async () => {
    const caller = coachBlockRouter.createCaller(createContext());
    mockCoachBlockService.delete.mockResolvedValue(undefined);

    const result = await caller.delete({
      coachId: TEST_IDS.coachId,
      blockId: TEST_IDS.blockId,
    });

    expect(result).toEqual({ success: true });
    expect(mockCoachBlockService.delete).toHaveBeenCalledWith(TEST_IDS.userId, {
      coachId: TEST_IDS.coachId,
      blockId: TEST_IDS.blockId,
    });
  });

  it("maps ownership errors to FORBIDDEN", async () => {
    const caller = coachHoursRouter.createCaller(createContext());
    mockCoachHoursService.getHours.mockRejectedValue(
      new CoachOwnershipError(TEST_IDS.coachId, TEST_IDS.userId),
    );

    await expect(
      caller.get({ coachId: TEST_IDS.coachId }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("maps missing block errors to NOT_FOUND", async () => {
    const caller = coachBlockRouter.createCaller(createContext());
    mockCoachBlockService.delete.mockRejectedValue(
      new CoachBlockNotFoundError(TEST_IDS.blockId),
    );

    await expect(
      caller.delete({
        coachId: TEST_IDS.coachId,
        blockId: TEST_IDS.blockId,
      }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("maps missing coach errors to NOT_FOUND", async () => {
    const caller = coachAddonRouter.createCaller(createContext());
    mockCoachAddonService.getByCoach.mockRejectedValue(
      new CoachNotFoundError(TEST_IDS.userId),
    );

    await expect(
      caller.get({ coachId: TEST_IDS.coachId }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});
