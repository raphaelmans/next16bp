import { describe, expect, it, vi } from "vitest";
import { CoachApi } from "@/features/coach/api";

const callTrpcQueryMock = vi.fn();
const callTrpcMutationMock = vi.fn();

vi.mock("@/common/trpc-client-call", () => ({
  callTrpcQuery: (...args: unknown[]) => callTrpcQueryMock(...args),
  callTrpcMutation: (...args: unknown[]) => callTrpcMutationMock(...args),
}));

describe("CoachApi", () => {
  it("queryCoachGetMyProfile uses the coach.getMyProfile transport path", async () => {
    const clientApi = {
      coach: {
        getMyProfile: { query: vi.fn() },
      },
    } as never;
    const toAppError = vi.fn((error: unknown) => error as never);
    const api = new CoachApi({ clientApi, toAppError });
    const expected = { coach: { id: "coach-1", name: "Coach Alex" } };
    callTrpcQueryMock.mockResolvedValue(expected);

    const result = await api.queryCoachGetMyProfile();

    expect(result).toEqual(expected);
    expect(callTrpcQueryMock).toHaveBeenCalledWith(
      clientApi,
      ["coach", "getMyProfile"],
      expect.any(Function),
      undefined,
      toAppError,
    );
  });

  it("mutCoachUpdateProfile uses the coach.updateProfile transport path", async () => {
    const clientApi = {
      coach: {
        updateProfile: { mutate: vi.fn() },
      },
    } as never;
    const toAppError = vi.fn((error: unknown) => error as never);
    const api = new CoachApi({ clientApi, toAppError });
    const expected = { coach: { id: "coach-1", name: "Coach Alex" } };
    callTrpcMutationMock.mockResolvedValue(expected);

    const result = await api.mutCoachUpdateProfile({
      name: "Coach Alex",
      tagline: "Private badminton sessions",
      bio: "Competitive player turned coach",
    });

    expect(result).toEqual(expected);
    expect(callTrpcMutationMock).toHaveBeenCalledWith(
      clientApi,
      ["coach", "updateProfile"],
      expect.any(Function),
      {
        name: "Coach Alex",
        tagline: "Private badminton sessions",
        bio: "Competitive player turned coach",
      },
      toAppError,
    );
  });

  it("querySportList uses the sport.list transport path", async () => {
    const clientApi = {
      sport: {
        list: { query: vi.fn() },
      },
    } as never;
    const toAppError = vi.fn((error: unknown) => error as never);
    const api = new CoachApi({ clientApi, toAppError });
    const expected = [{ id: "sport-1", name: "Badminton" }];
    callTrpcQueryMock.mockResolvedValue(expected);

    const result = await api.querySportList();

    expect(result).toEqual(expected);
    expect(callTrpcQueryMock).toHaveBeenCalledWith(
      clientApi,
      ["sport", "list"],
      expect.any(Function),
      undefined,
      toAppError,
    );
  });

  it("queryCoachPaymentListMethods uses the coachPayment.listMethods transport path", async () => {
    const clientApi = {
      coachPayment: {
        listMethods: { query: vi.fn() },
      },
    } as never;
    const toAppError = vi.fn((error: unknown) => error as never);
    const api = new CoachApi({ clientApi, toAppError });
    const expected = { methods: [{ id: "payment-1" }] };
    callTrpcQueryMock.mockResolvedValue(expected);

    const result = await api.queryCoachPaymentListMethods({
      coachId: "coach-1",
    });

    expect(result).toEqual(expected);
    expect(callTrpcQueryMock).toHaveBeenCalledWith(
      clientApi,
      ["coachPayment", "listMethods"],
      expect.any(Function),
      { coachId: "coach-1" },
      toAppError,
    );
  });

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

  it("mutCoachPaymentCreateMethod uses the coachPayment.createMethod transport path", async () => {
    const clientApi = {
      coachPayment: {
        createMethod: { mutate: vi.fn() },
      },
    } as never;
    const toAppError = vi.fn((error: unknown) => error as never);
    const api = new CoachApi({ clientApi, toAppError });
    const expected = { method: { id: "payment-1" } };
    callTrpcMutationMock.mockResolvedValue(expected);

    const result = await api.mutCoachPaymentCreateMethod({
      coachId: "coach-1",
      type: "MOBILE_WALLET",
      provider: "GCASH",
      accountName: "Coach One",
      accountNumber: "09171234567",
      instructions: "Use reservation ID",
      isActive: true,
      isDefault: true,
    });

    expect(result).toEqual(expected);
    expect(callTrpcMutationMock).toHaveBeenCalledWith(
      clientApi,
      ["coachPayment", "createMethod"],
      expect.any(Function),
      {
        coachId: "coach-1",
        type: "MOBILE_WALLET",
        provider: "GCASH",
        accountName: "Coach One",
        accountNumber: "09171234567",
        instructions: "Use reservation ID",
        isActive: true,
        isDefault: true,
      },
      toAppError,
    );
  });
});
