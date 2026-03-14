import { describe, expect, it, vi } from "vitest";
import { CoachApi } from "@/features/coach/api";

const callTrpcQueryMock = vi.fn();
const callTrpcMutationMock = vi.fn();

vi.mock("@/common/trpc-client-call", () => ({
  callTrpcQuery: (...args: unknown[]) => callTrpcQueryMock(...args),
  callTrpcMutation: (...args: unknown[]) => callTrpcMutationMock(...args),
}));

describe("CoachApi", () => {
  it("queryCoachHoursGet uses the coachHours.get transport path", async () => {
    const clientApi = {
      coachHours: {
        get: { query: vi.fn() },
      },
    } as never;
    const toAppError = vi.fn((error: unknown) => error as never);
    const api = new CoachApi({ clientApi, toAppError });
    const expected = [{ dayOfWeek: 1, startMinute: 480, endMinute: 1020 }];
    callTrpcQueryMock.mockResolvedValue(expected);

    const result = await api.queryCoachHoursGet({
      coachId: "coach-1",
    });

    expect(result).toEqual(expected);
    expect(callTrpcQueryMock).toHaveBeenCalledWith(
      clientApi,
      ["coachHours", "get"],
      expect.any(Function),
      { coachId: "coach-1" },
      toAppError,
    );
  });

  it("queryCoachBlockList uses the coachBlock.list transport path", async () => {
    const clientApi = {
      coachBlock: {
        list: { query: vi.fn() },
      },
    } as never;
    const toAppError = vi.fn((error: unknown) => error as never);
    const api = new CoachApi({ clientApi, toAppError });
    const expected = [{ id: "block-1" }];
    callTrpcQueryMock.mockResolvedValue(expected);

    const result = await api.queryCoachBlockList({
      coachId: "coach-1",
      startTime: "2026-03-14T00:00:00.000Z",
      endTime: "2026-03-20T23:59:59.000Z",
    });

    expect(result).toEqual(expected);
    expect(callTrpcQueryMock).toHaveBeenCalledWith(
      clientApi,
      ["coachBlock", "list"],
      expect.any(Function),
      {
        coachId: "coach-1",
        startTime: "2026-03-14T00:00:00.000Z",
        endTime: "2026-03-20T23:59:59.000Z",
      },
      toAppError,
    );
  });

  it("mutCoachRateRuleSet uses the coachRateRule.set transport path", async () => {
    const clientApi = {
      coachRateRule: {
        set: { mutate: vi.fn() },
      },
    } as never;
    const toAppError = vi.fn((error: unknown) => error as never);
    const api = new CoachApi({ clientApi, toAppError });
    const expected = [{ dayOfWeek: 1, hourlyRateCents: 150000 }];
    callTrpcMutationMock.mockResolvedValue(expected);

    const result = await api.mutCoachRateRuleSet({
      coachId: "coach-1",
      rules: [
        {
          dayOfWeek: 1,
          startMinute: 480,
          endMinute: 1020,
          hourlyRateCents: 150000,
        },
      ],
    });

    expect(result).toEqual(expected);
    expect(callTrpcMutationMock).toHaveBeenCalledWith(
      clientApi,
      ["coachRateRule", "set"],
      expect.any(Function),
      {
        coachId: "coach-1",
        rules: [
          {
            dayOfWeek: 1,
            startMinute: 480,
            endMinute: 1020,
            hourlyRateCents: 150000,
          },
        ],
      },
      toAppError,
    );
  });

  it("mutCoachAddonSet uses the coachAddon.set transport path", async () => {
    const clientApi = {
      coachAddon: {
        set: { mutate: vi.fn() },
      },
    } as never;
    const toAppError = vi.fn((error: unknown) => error as never);
    const api = new CoachApi({ clientApi, toAppError });
    const expected = [{ addon: { label: "Travel fee" }, rules: [] }];
    callTrpcMutationMock.mockResolvedValue(expected);

    const result = await api.mutCoachAddonSet({
      coachId: "coach-1",
      addons: [
        {
          label: "Travel fee",
          mode: "OPTIONAL",
          pricingType: "FLAT",
          flatFeeCents: 50000,
          rules: [],
        },
      ],
    });

    expect(result).toEqual(expected);
    expect(callTrpcMutationMock).toHaveBeenCalledWith(
      clientApi,
      ["coachAddon", "set"],
      expect.any(Function),
      {
        coachId: "coach-1",
        addons: [
          {
            label: "Travel fee",
            mode: "OPTIONAL",
            pricingType: "FLAT",
            flatFeeCents: 50000,
            rules: [],
          },
        ],
      },
      toAppError,
    );
  });
});
