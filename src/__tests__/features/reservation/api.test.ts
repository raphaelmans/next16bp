import { describe, expect, it, vi } from "vitest";
import { ReservationApi } from "@/features/reservation/api";

const callTrpcQueryMock = vi.fn();
const callTrpcMutationMock = vi.fn();

vi.mock("@/common/trpc-client-call", () => ({
  callTrpcQuery: (...args: unknown[]) => callTrpcQueryMock(...args),
  callTrpcMutation: (...args: unknown[]) => callTrpcMutationMock(...args),
}));

describe("ReservationApi", () => {
  it("queryReservationGetLinkedDetail success -> uses getLinkedDetail transport path", async () => {
    // Arrange
    const clientApi = {
      reservation: {
        getLinkedDetail: { query: vi.fn() },
      },
    } as never;
    const toAppError = vi.fn((error: unknown) => error as never);
    const api = new ReservationApi({ clientApi, toAppError });
    const expected = { reservationGroup: { id: "group-1" } };
    callTrpcQueryMock.mockResolvedValue(expected);

    // Act
    const result = await api.queryReservationGetLinkedDetail({
      reservationId: "res-1",
    });

    // Assert
    expect(result).toEqual(expected);
    expect(callTrpcQueryMock).toHaveBeenCalledWith(
      clientApi,
      ["reservation", "getLinkedDetail"],
      expect.any(Function),
      { reservationId: "res-1" },
      toAppError,
    );
  });

  it("mutReservationMarkPaymentLinked success -> uses markPaymentLinked transport path", async () => {
    // Arrange
    const clientApi = {
      reservation: {
        markPaymentLinked: { mutate: vi.fn() },
      },
    } as never;
    const toAppError = vi.fn((error: unknown) => error as never);
    const api = new ReservationApi({ clientApi, toAppError });
    const expected = { reservationGroupId: "group-1", reservations: [] };
    callTrpcMutationMock.mockResolvedValue(expected);

    // Act
    const result = await api.mutReservationMarkPaymentLinked({
      reservationId: "res-1",
      termsAccepted: true,
    });

    // Assert
    expect(result).toEqual(expected);
    expect(callTrpcMutationMock).toHaveBeenCalledWith(
      clientApi,
      ["reservation", "markPaymentLinked"],
      expect.any(Function),
      { reservationId: "res-1", termsAccepted: true },
      toAppError,
    );
  });
});
