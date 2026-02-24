import { describe, expect, it, vi } from "vitest";
import { ReservationApi } from "@/features/reservation/api";

const callTrpcQueryMock = vi.fn();
const callTrpcMutationMock = vi.fn();

vi.mock("@/common/trpc-client-call", () => ({
  callTrpcQuery: (...args: unknown[]) => callTrpcQueryMock(...args),
  callTrpcMutation: (...args: unknown[]) => callTrpcMutationMock(...args),
}));

describe("ReservationApi", () => {
  it("queryReservationGetGroupDetail success -> uses getGroupDetail transport path", async () => {
    // Arrange
    const clientApi = {
      reservation: {
        getGroupDetail: { query: vi.fn() },
      },
    } as never;
    const toAppError = vi.fn((error: unknown) => error as never);
    const api = new ReservationApi({ clientApi, toAppError });
    const expected = { reservationGroup: { id: "group-1" } };
    callTrpcQueryMock.mockResolvedValue(expected);

    // Act
    const result = await api.queryReservationGetGroupDetail({
      reservationGroupId: "group-1",
    });

    // Assert
    expect(result).toEqual(expected);
    expect(callTrpcQueryMock).toHaveBeenCalledWith(
      clientApi,
      ["reservation", "getGroupDetail"],
      expect.any(Function),
      { reservationGroupId: "group-1" },
      toAppError,
    );
  });

  it("mutReservationMarkPaymentGroup success -> uses markPaymentGroup transport path", async () => {
    // Arrange
    const clientApi = {
      reservation: {
        markPaymentGroup: { mutate: vi.fn() },
      },
    } as never;
    const toAppError = vi.fn((error: unknown) => error as never);
    const api = new ReservationApi({ clientApi, toAppError });
    const expected = { reservationGroupId: "group-1" };
    callTrpcMutationMock.mockResolvedValue(expected);

    // Act
    const result = await api.mutReservationMarkPaymentGroup({
      reservationGroupId: "group-1",
      termsAccepted: true,
    });

    // Assert
    expect(result).toEqual(expected);
    expect(callTrpcMutationMock).toHaveBeenCalledWith(
      clientApi,
      ["reservation", "markPaymentGroup"],
      expect.any(Function),
      { reservationGroupId: "group-1", termsAccepted: true },
      toAppError,
    );
  });
});
