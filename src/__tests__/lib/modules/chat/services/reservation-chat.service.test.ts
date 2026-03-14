import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/shared/infra/container", () => ({
  getContainer: () => ({ db: {} }),
}));

import { ReservationChatService } from "@/lib/modules/chat/services/reservation-chat.service";

type ReservationMetaRow = {
  organizationId: string;
  ownerUserId: string;
  playerUserId: string;
  coachId: string | null;
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
  organizationId: string;
  ownerUserId: string;
  playerUserId: string;
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

const makeService = (options?: { hasOrganizationPermission?: boolean }) => {
  const organizationMemberService =
    options?.hasOrganizationPermission === undefined
      ? undefined
      : {
          hasOrganizationPermission: vi
            .fn()
            .mockResolvedValue(options.hasOrganizationPermission),
          listOrganizationUserIdsWithPermission: vi.fn().mockResolvedValue([]),
        };

  return {
    service: new ReservationChatService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      organizationMemberService,
    ),
    organizationMemberService,
  };
};

describe("ReservationChatService.getThreadMetas", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-21T10:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("default options with reservation ids -> excludes archived and inactive rows", async () => {
    const baseDate = new Date("2026-02-21T10:00:00.000Z");
    const reservationRows: ReservationMetaRow[] = [
      {
        organizationId: "org-1",
        ownerUserId: "owner-1",
        playerUserId: "player-1",
        coachId: null,
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
        organizationId: "org-1",
        ownerUserId: "owner-1",
        playerUserId: "player-1",
        coachId: null,
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
        organizationId: "org-1",
        ownerUserId: "owner-1",
        playerUserId: "player-1",
        coachId: null,
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
    const tx = createFakeTx([reservationRows, [], archivedRows]);
    const { service } = makeService();

    const result = await service.getThreadMetas(
      "player-1",
      {
        reservationIds: ["r-1", "r-2", "r-3"],
        reservationGroupIds: [],
      },
      { tx },
    );

    expect(result.map((item) => item.threadId)).toEqual(["res-r-3"]);
  });

  it("includeArchived true -> returns rows without active/archived filtering", async () => {
    const baseDate = new Date("2026-02-21T10:00:00.000Z");
    const reservationRows: ReservationMetaRow[] = [
      {
        organizationId: "org-1",
        ownerUserId: "owner-1",
        playerUserId: "player-1",
        coachId: null,
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
        organizationId: "org-1",
        ownerUserId: "owner-1",
        playerUserId: "player-1",
        coachId: null,
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
    const tx = createFakeTx([reservationRows, []]);
    const { service } = makeService();

    const result = await service.getThreadMetas(
      "player-1",
      {
        reservationIds: ["r-1", "r-2"],
        reservationGroupIds: [],
        includeArchived: true,
      },
      { tx },
    );

    expect(result.map((item) => item.threadId)).toEqual(["res-r-1", "res-r-2"]);
  });

  it("reservation group ids -> returns consolidated grp-* thread metadata", async () => {
    const groupRows: ReservationGroupMetaRow[] = [
      {
        organizationId: "org-1",
        ownerUserId: "owner-1",
        playerUserId: "player-1",
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
        organizationId: "org-1",
        ownerUserId: "owner-1",
        playerUserId: "player-1",
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
    const { service } = makeService();

    const result = await service.getThreadMetas(
      "player-1",
      {
        reservationIds: [],
        reservationGroupIds: ["group-1"],
      },
      { tx },
    );

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

  it("owner-side member with chat permission can access thread metas", async () => {
    const baseDate = new Date("2026-02-21T10:00:00.000Z");
    const reservationRows: ReservationMetaRow[] = [
      {
        organizationId: "org-1",
        ownerUserId: "owner-1",
        playerUserId: "player-1",
        coachId: null,
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
    ];
    const tx = createFakeTx([reservationRows, [], []]);
    const { service, organizationMemberService } = makeService({
      hasOrganizationPermission: true,
    });

    const result = await service.getThreadMetas(
      "manager-1",
      {
        reservationIds: ["r-1"],
        reservationGroupIds: [],
      },
      { tx },
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.threadId).toBe("res-r-1");
    expect(organizationMemberService).toBeDefined();
    if (!organizationMemberService) {
      throw new Error("Expected organizationMemberService");
    }
    expect(
      vi.mocked(organizationMemberService.hasOrganizationPermission),
    ).toHaveBeenCalledWith("manager-1", "org-1", "reservation.chat", {
      tx,
    });
  });

  it("owner-side member without chat permission is filtered out", async () => {
    const baseDate = new Date("2026-02-21T10:00:00.000Z");
    const reservationRows: ReservationMetaRow[] = [
      {
        organizationId: "org-1",
        ownerUserId: "owner-1",
        playerUserId: "player-1",
        coachId: null,
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
    ];
    const tx = createFakeTx([reservationRows, []]);
    const { service, organizationMemberService } = makeService({
      hasOrganizationPermission: false,
    });

    const result = await service.getThreadMetas(
      "viewer-1",
      {
        reservationIds: ["r-1"],
        reservationGroupIds: [],
      },
      { tx },
    );

    expect(result).toEqual([]);
    expect(organizationMemberService).toBeDefined();
    if (!organizationMemberService) {
      throw new Error("Expected organizationMemberService");
    }
    expect(
      vi.mocked(organizationMemberService.hasOrganizationPermission),
    ).toHaveBeenCalledWith("viewer-1", "org-1", "reservation.chat", {
      tx,
    });
  });

  it("coach reservation threads are accessible to the player and coach owner", async () => {
    const baseDate = new Date("2026-02-21T10:00:00.000Z");
    const coachReservationRows: ReservationMetaRow[] = [
      {
        organizationId: "coach-1",
        ownerUserId: "coach-user-1",
        playerUserId: "player-1",
        coachId: "coach-1",
        reservationId: "r-coach-1",
        reservationGroupId: null,
        status: "CONFIRMED",
        updatedAt: baseDate,
        startTime: baseDate,
        endTime: new Date("2026-02-21T11:00:00.000Z"),
        courtLabel: "Coach Carla",
        placeName: "Coach Carla",
        timeZone: "Asia/Manila",
        playerDisplayName: "Player A",
        ownerDisplayName: "Coach Carla",
      },
    ];

    const playerTx = createFakeTx([[], coachReservationRows, []]);
    const { service: playerService } = makeService({
      hasOrganizationPermission: false,
    });

    const playerResult = await playerService.getThreadMetas(
      "player-1",
      {
        reservationIds: ["r-coach-1"],
        reservationGroupIds: [],
      },
      { tx: playerTx },
    );

    expect(playerResult).toHaveLength(1);
    expect(playerResult[0]).toMatchObject({
      threadId: "res-r-coach-1",
      reservationId: "r-coach-1",
      ownerDisplayName: "Coach Carla",
      placeName: "Coach Carla",
      courtLabel: "Coaching session",
    });

    const coachTx = createFakeTx([[], coachReservationRows, []]);
    const { service: coachService, organizationMemberService } = makeService({
      hasOrganizationPermission: false,
    });

    const coachResult = await coachService.getThreadMetas(
      "coach-user-1",
      {
        reservationIds: ["r-coach-1"],
        reservationGroupIds: [],
      },
      { tx: coachTx },
    );

    expect(coachResult).toHaveLength(1);
    expect(organizationMemberService).toBeDefined();
    if (!organizationMemberService) {
      throw new Error("Expected organizationMemberService");
    }
    expect(
      vi.mocked(organizationMemberService.hasOrganizationPermission),
    ).not.toHaveBeenCalled();
  });
});
