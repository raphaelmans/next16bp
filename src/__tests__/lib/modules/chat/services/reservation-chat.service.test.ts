import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/shared/infra/container", () => ({
  getContainer: () => ({ db: {} }),
}));

import { ReservationChatService } from "@/lib/modules/chat/services/reservation-chat.service";

type MetaRow = {
  reservationId: string;
  status: string;
  updatedAt: Date;
  startTime: Date;
  endTime: Date;
  courtLabel: string;
  placeName: string;
  timeZone: string;
  playerUserId: string;
  playerDisplayName: string | null;
  ownerUserId: string;
  ownerDisplayName: string;
};

function createFakeTx(rows: MetaRow[], archivedThreadIds: string[]) {
  let selectCount = 0;

  return {
    select() {
      selectCount += 1;
      const isArchiveQuery = selectCount > 1;

      const chain = {
        from() {
          return chain;
        },
        innerJoin() {
          return chain;
        },
        where: async () => {
          if (isArchiveQuery) {
            return archivedThreadIds.map((threadId) => ({ threadId }));
          }
          return rows;
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

  it("default options -> excludes archived and inactive/past rows", async () => {
    // Arrange
    const baseDate = new Date("2026-02-21T10:00:00.000Z");
    const rows: MetaRow[] = [
      {
        reservationId: "r-1",
        status: "CREATED",
        updatedAt: baseDate,
        startTime: baseDate,
        endTime: new Date("2026-02-21T11:00:00.000Z"),
        courtLabel: "Court A",
        placeName: "Place A",
        timeZone: "Asia/Manila",
        playerUserId: "player-1",
        playerDisplayName: "Player A",
        ownerUserId: "owner-1",
        ownerDisplayName: "Owner A",
      },
      {
        reservationId: "r-2",
        status: "CONFIRMED",
        updatedAt: baseDate,
        startTime: baseDate,
        endTime: new Date("2026-02-20T11:00:00.000Z"),
        courtLabel: "Court B",
        placeName: "Place B",
        timeZone: "Asia/Manila",
        playerUserId: "player-1",
        playerDisplayName: "Player B",
        ownerUserId: "owner-1",
        ownerDisplayName: "Owner B",
      },
      {
        reservationId: "r-3",
        status: "CONFIRMED",
        updatedAt: baseDate,
        startTime: baseDate,
        endTime: new Date("2026-02-22T11:00:00.000Z"),
        courtLabel: "Court C",
        placeName: "Place C",
        timeZone: "Asia/Manila",
        playerUserId: "player-1",
        playerDisplayName: "Player C",
        ownerUserId: "owner-1",
        ownerDisplayName: "Owner C",
      },
      {
        reservationId: "r-4",
        status: "CANCELLED",
        updatedAt: baseDate,
        startTime: baseDate,
        endTime: new Date("2026-02-22T11:00:00.000Z"),
        courtLabel: "Court D",
        placeName: "Place D",
        timeZone: "Asia/Manila",
        playerUserId: "player-1",
        playerDisplayName: "Player D",
        ownerUserId: "owner-1",
        ownerDisplayName: "Owner D",
      },
    ];
    const tx = createFakeTx(rows, ["res-r-1"]);
    const service = makeService();

    // Act
    const result = await service.getThreadMetas(
      "player-1",
      ["r-1", "r-2", "r-3", "r-4"],
      undefined,
      { tx },
    );

    // Assert
    expect(result.map((item) => item.reservationId)).toEqual(["r-3"]);
  });

  it("includeArchived true -> returns rows regardless active/default filters", async () => {
    // Arrange
    const baseDate = new Date("2026-02-21T10:00:00.000Z");
    const rows: MetaRow[] = [
      {
        reservationId: "r-1",
        status: "CREATED",
        updatedAt: baseDate,
        startTime: baseDate,
        endTime: new Date("2026-02-21T11:00:00.000Z"),
        courtLabel: "Court A",
        placeName: "Place A",
        timeZone: "Asia/Manila",
        playerUserId: "player-1",
        playerDisplayName: "Player A",
        ownerUserId: "owner-1",
        ownerDisplayName: "Owner A",
      },
      {
        reservationId: "r-2",
        status: "CANCELLED",
        updatedAt: baseDate,
        startTime: baseDate,
        endTime: new Date("2026-02-20T11:00:00.000Z"),
        courtLabel: "Court B",
        placeName: "Place B",
        timeZone: "Asia/Manila",
        playerUserId: "player-1",
        playerDisplayName: "Player B",
        ownerUserId: "owner-1",
        ownerDisplayName: "Owner B",
      },
    ];
    const tx = createFakeTx(rows, ["res-r-1"]);
    const service = makeService();

    // Act
    const result = await service.getThreadMetas(
      "player-1",
      ["r-1", "r-2"],
      { includeArchived: true },
      { tx },
    );

    // Assert
    expect(result.map((item) => item.reservationId)).toEqual(["r-1", "r-2"]);
  });
});
