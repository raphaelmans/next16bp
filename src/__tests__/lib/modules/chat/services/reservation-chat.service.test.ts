import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/shared/infra/container", () => ({
  getContainer: () => ({ db: {} }),
}));

import { ReservationChatService } from "@/lib/modules/chat/services/reservation-chat.service";

type ReservationMetaRow = {
  reservationId: string;
  reservationGroupId: string | null;
  status: string;
  updatedAt: Date;
  startTime: Date;
  endTime: Date;
  courtLabel: string;
  placeName: string;
  timeZone: string;
  playerDisplayName: string | null;
  ownerDisplayName: string;
};

type ReservationGroupMetaRow = {
  reservationGroupId: string;
  reservationId: string;
  status: string;
  updatedAt: Date;
  startTime: Date;
  endTime: Date;
  courtLabel: string;
  placeName: string;
  timeZone: string;
  playerDisplayName: string | null;
  ownerDisplayName: string;
};

function createFakeTx(queryResults: unknown[]) {
  let cursor = 0;

  return {
    select() {
      const chain = {
        from() {
          return chain;
        },
        innerJoin() {
          return chain;
        },
        where: async () => {
          const result = queryResults[cursor];
          cursor += 1;
          return (result ?? []) as unknown[];
        },
      };

      return chain;
    },
  };
}

const makeService = () =>
  new ReservationChatService(
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );

describe("ReservationChatService.getThreadMetas", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-21T10:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("default options with reservation ids -> excludes archived and inactive rows", async () => {
    // Arrange
    const baseDate = new Date("2026-02-21T10:00:00.000Z");
    const reservationRows: ReservationMetaRow[] = [
      {
        reservationId: "r-1",
        reservationGroupId: null,
        status: "CREATED",
        updatedAt: baseDate,
        startTime: baseDate,
        endTime: new Date("2026-02-21T11:00:00.000Z"),
        courtLabel: "Court A",
        placeName: "Place A",
        timeZone: "Asia/Manila",
        playerDisplayName: "Player A",
        ownerDisplayName: "Owner A",
      },
      {
        reservationId: "r-2",
        reservationGroupId: null,
        status: "CONFIRMED",
        updatedAt: baseDate,
        startTime: baseDate,
        endTime: new Date("2026-02-20T11:00:00.000Z"),
        courtLabel: "Court B",
        placeName: "Place B",
        timeZone: "Asia/Manila",
        playerDisplayName: "Player B",
        ownerDisplayName: "Owner B",
      },
      {
        reservationId: "r-3",
        reservationGroupId: null,
        status: "CONFIRMED",
        updatedAt: baseDate,
        startTime: baseDate,
        endTime: new Date("2026-02-22T11:00:00.000Z"),
        courtLabel: "Court C",
        placeName: "Place C",
        timeZone: "Asia/Manila",
        playerDisplayName: "Player C",
        ownerDisplayName: "Owner C",
      },
    ];
    const archivedRows = [{ threadId: "res-r-1" }];
    const tx = createFakeTx([reservationRows, archivedRows]);
    const service = makeService();

    // Act
    const result = await service.getThreadMetas(
      "player-1",
      {
        reservationIds: ["r-1", "r-2", "r-3"],
        reservationGroupIds: [],
      },
      { tx },
    );

    // Assert
    expect(result.map((item) => item.threadId)).toEqual(["res-r-3"]);
  });

  it("includeArchived true -> returns rows without active/archived filtering", async () => {
    // Arrange
    const baseDate = new Date("2026-02-21T10:00:00.000Z");
    const reservationRows: ReservationMetaRow[] = [
      {
        reservationId: "r-1",
        reservationGroupId: null,
        status: "CREATED",
        updatedAt: baseDate,
        startTime: baseDate,
        endTime: new Date("2026-02-21T11:00:00.000Z"),
        courtLabel: "Court A",
        placeName: "Place A",
        timeZone: "Asia/Manila",
        playerDisplayName: "Player A",
        ownerDisplayName: "Owner A",
      },
      {
        reservationId: "r-2",
        reservationGroupId: null,
        status: "CANCELLED",
        updatedAt: baseDate,
        startTime: baseDate,
        endTime: new Date("2026-02-20T11:00:00.000Z"),
        courtLabel: "Court B",
        placeName: "Place B",
        timeZone: "Asia/Manila",
        playerDisplayName: "Player B",
        ownerDisplayName: "Owner B",
      },
    ];
    const tx = createFakeTx([reservationRows]);
    const service = makeService();

    // Act
    const result = await service.getThreadMetas(
      "player-1",
      {
        reservationIds: ["r-1", "r-2"],
        reservationGroupIds: [],
        includeArchived: true,
      },
      { tx },
    );

    // Assert
    expect(result.map((item) => item.threadId)).toEqual(["res-r-1", "res-r-2"]);
  });

  it("reservation group ids -> returns consolidated grp-* thread metadata", async () => {
    // Arrange
    const groupRows: ReservationGroupMetaRow[] = [
      {
        reservationGroupId: "group-1",
        reservationId: "r-1",
        status: "CREATED",
        updatedAt: new Date("2026-02-21T10:05:00.000Z"),
        startTime: new Date("2026-02-22T09:00:00.000Z"),
        endTime: new Date("2026-02-22T10:00:00.000Z"),
        courtLabel: "Court A",
        placeName: "Place A",
        timeZone: "Asia/Manila",
        playerDisplayName: "Player A",
        ownerDisplayName: "Owner A",
      },
      {
        reservationGroupId: "group-1",
        reservationId: "r-2",
        status: "AWAITING_PAYMENT",
        updatedAt: new Date("2026-02-21T10:06:00.000Z"),
        startTime: new Date("2026-02-22T11:00:00.000Z"),
        endTime: new Date("2026-02-22T12:00:00.000Z"),
        courtLabel: "Court B",
        placeName: "Place A",
        timeZone: "Asia/Manila",
        playerDisplayName: "Player A",
        ownerDisplayName: "Owner A",
      },
    ];
    const archivedRows: Array<{ threadId: string }> = [];
    const tx = createFakeTx([groupRows, archivedRows]);
    const service = makeService();

    // Act
    const result = await service.getThreadMetas(
      "player-1",
      {
        reservationIds: [],
        reservationGroupIds: ["group-1"],
      },
      { tx },
    );

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      threadId: "grp-group-1",
      reservationGroupId: "group-1",
      reservationId: "r-1",
      status: "CREATED",
      courtLabel: "2 courts",
      placeName: "Place A",
    });
    expect(result[0].endTimeIso).toBe("2026-02-22T12:00:00.000Z");
  });
});
