import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  appendAvailabilityBlock,
  reconcileAvailabilityBlockInRange,
  removeAvailabilityBlock,
  replaceAvailabilityBlock,
  updateAvailabilityBlockRange,
  useModOwnerAvailabilityReservationSync,
} from "@/features/owner/hooks/availability-sync";

const { syncOwnerAvailabilityRangeMock, subscribeOwnerMock, unsubscribeMock } =
  vi.hoisted(() => ({
    syncOwnerAvailabilityRangeMock: vi.fn(async () => undefined),
    subscribeOwnerMock: vi.fn(),
    unsubscribeMock: vi.fn(),
  }));

vi.mock("@/features/reservation/realtime-api.runtime", () => ({
  getReservationRealtimeApi: () => ({
    subscribeOwner: subscribeOwnerMock,
  }),
}));

vi.mock("@/features/reservation/sync", () => ({
  useModReservationSync: () => ({
    syncOwnerAvailabilityRange: syncOwnerAvailabilityRangeMock,
  }),
}));

const baseBlock = {
  id: "block-1",
  startTime: "2026-03-07T09:00:00.000Z",
  endTime: "2026-03-07T10:00:00.000Z",
};

describe("availability sync helpers", () => {
  it("appends optimistic blocks", () => {
    expect(appendAvailabilityBlock([], baseBlock)).toEqual([baseBlock]);
  });

  it("replaces a matching block or appends when missing", () => {
    const replacement = { ...baseBlock, endTime: "2026-03-07T11:00:00.000Z" };

    expect(
      replaceAvailabilityBlock([baseBlock], "block-1", replacement),
    ).toEqual([replacement]);
    expect(replaceAvailabilityBlock([], "missing", replacement)).toEqual([
      replacement,
    ]);
  });

  it("removes cancelled blocks", () => {
    expect(removeAvailabilityBlock([baseBlock], "block-1")).toEqual([]);
  });

  it("updates only the targeted range fields", () => {
    expect(
      updateAvailabilityBlockRange([baseBlock], "block-1", {
        startTime: "2026-03-07T08:30:00.000Z",
        endTime: "2026-03-07T10:30:00.000Z",
      }),
    ).toEqual([
      {
        ...baseBlock,
        startTime: "2026-03-07T08:30:00.000Z",
        endTime: "2026-03-07T10:30:00.000Z",
      },
    ]);
  });

  it("reconciles server blocks against the visible range", () => {
    const replacement = {
      ...baseBlock,
      id: "block-1",
      endTime: "2026-03-07T12:00:00.000Z",
    };

    expect(
      reconcileAvailabilityBlockInRange(
        [baseBlock],
        "block-1",
        replacement,
        true,
      ),
    ).toEqual([replacement]);
    expect(
      reconcileAvailabilityBlockInRange(
        [baseBlock],
        "block-1",
        replacement,
        false,
      ),
    ).toEqual([]);
  });

  it("invalidates the visible owner reservation range on realtime events", () => {
    let onEvent: (() => void) | undefined;
    subscribeOwnerMock.mockImplementation((input: { onEvent: () => void }) => {
      onEvent = input.onEvent;
      return { unsubscribe: unsubscribeMock };
    });

    renderHook(() =>
      useModOwnerAvailabilityReservationSync({
        enabled: true,
        reservationsQueryInput: {
          courtId: "court-1",
          startTime: "2026-03-07T00:00:00.000Z",
          endTime: "2026-03-08T00:00:00.000Z",
        },
      }),
    );

    onEvent?.();

    expect(syncOwnerAvailabilityRangeMock).toHaveBeenCalledWith({
      courtId: "court-1",
      startTime: "2026-03-07T00:00:00.000Z",
      endTime: "2026-03-08T00:00:00.000Z",
    });
  });
});
