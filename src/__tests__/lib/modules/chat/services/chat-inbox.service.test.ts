import { describe, expect, it, vi } from "vitest";
import type {
  ChatInboxThreadKind,
  IChatInboxArchiveRepository,
} from "@/lib/modules/chat/repositories/chat-inbox-archive.repository";
import { ChatInboxService } from "@/lib/modules/chat/services/chat-inbox.service";
import { ValidationError } from "@/lib/shared/kernel/errors";

type Viewer = {
  userId: string;
  role: "admin" | "member" | "viewer";
};

const viewer: Viewer = {
  userId: "user-1",
  role: "member",
};

const makeArchiveRepository = (): IChatInboxArchiveRepository => ({
  upsert: vi.fn(async () => ({
    id: "archive-1",
    userId: "user-1",
    threadKind: "reservation",
    threadId: "res-1",
    archivedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
  removeByThread: vi.fn(async () => true),
  listThreadIdsByKind: vi.fn(async () => ["res-1"]),
});

const makeDbWithQueryResults = (queryResults: unknown[][]) => {
  let cursor = 0;

  const chain = {
    from: vi.fn(() => chain),
    innerJoin: vi.fn(() => chain),
    where: vi.fn(() => chain),
    limit: vi.fn(async () => {
      const result = queryResults[cursor];
      cursor += 1;
      return (result ?? []) as unknown[];
    }),
  };

  return {
    select: vi.fn(() => chain),
  };
};

describe("ChatInboxService", () => {
  describe("hasThreadAccess", () => {
    it("reservation thread + manager with reservation.chat -> allows access", async () => {
      // Arrange
      const db = makeDbWithQueryResults([
        [
          {
            reservationId: "r-1",
            organizationId: "org-1",
            ownerUserId: "owner-1",
            playerUserId: "player-1",
          },
        ],
      ]);
      const organizationMemberService = {
        hasOrganizationPermission: vi.fn(async () => true),
      };
      const service = new ChatInboxService(
        db as never,
        makeArchiveRepository(),
        organizationMemberService,
      );

      // Act
      const result = await service.hasThreadAccess(
        { userId: "manager-1", role: "member" },
        "res-r-1",
      );

      // Assert
      expect(result).toBe(true);
      expect(
        organizationMemberService.hasOrganizationPermission,
      ).toHaveBeenCalledWith(
        "manager-1",
        "org-1",
        "reservation.chat",
        undefined,
      );
    });

    it("reservation thread + member without reservation.chat -> denies access", async () => {
      // Arrange
      const db = makeDbWithQueryResults([
        [
          {
            reservationId: "r-1",
            organizationId: "org-1",
            ownerUserId: "owner-1",
            playerUserId: "player-1",
          },
        ],
      ]);
      const organizationMemberService = {
        hasOrganizationPermission: vi.fn(async () => false),
      };
      const service = new ChatInboxService(
        db as never,
        makeArchiveRepository(),
        organizationMemberService,
      );

      // Act
      const result = await service.hasThreadAccess(
        { userId: "viewer-1", role: "member" },
        "res-r-1",
      );

      // Assert
      expect(result).toBe(false);
      expect(
        organizationMemberService.hasOrganizationPermission,
      ).toHaveBeenCalledWith(
        "viewer-1",
        "org-1",
        "reservation.chat",
        undefined,
      );
    });

    it("reservation group thread + manager with reservation.chat -> allows access", async () => {
      // Arrange
      const db = makeDbWithQueryResults([
        [
          {
            reservationGroupId: "group-1",
            organizationId: "org-1",
            ownerUserId: "owner-1",
            playerUserId: "player-1",
          },
        ],
      ]);
      const organizationMemberService = {
        hasOrganizationPermission: vi.fn(async () => true),
      };
      const service = new ChatInboxService(
        db as never,
        makeArchiveRepository(),
        organizationMemberService,
      );

      // Act
      const result = await service.hasThreadAccess(
        { userId: "manager-1", role: "member" },
        "grp-group-1",
      );

      // Assert
      expect(result).toBe(true);
      expect(
        organizationMemberService.hasOrganizationPermission,
      ).toHaveBeenCalledWith(
        "manager-1",
        "org-1",
        "reservation.chat",
        undefined,
      );
    });
  });

  describe("archiveThread", () => {
    it("invalid reservation prefix -> throws validation error", async () => {
      // Arrange
      const service = new ChatInboxService(
        {} as never,
        makeArchiveRepository(),
      );

      // Act + Assert
      await expect(
        service.archiveThread(viewer, {
          threadKind: "reservation",
          threadId: "bad-1",
        }),
      ).rejects.toBeInstanceOf(ValidationError);
    });

    it("authorized request -> upserts archive row", async () => {
      // Arrange
      const archiveRepository = makeArchiveRepository();
      const service = new ChatInboxService({} as never, archiveRepository);
      vi.spyOn(
        service as unknown as {
          assertViewerAccess: (...args: unknown[]) => Promise<void>;
        },
        "assertViewerAccess",
      ).mockResolvedValue(undefined);

      // Act
      const result = await service.archiveThread(viewer, {
        threadKind: "support",
        threadId: "cr-1",
      });

      // Assert
      expect(result).toEqual({ ok: true });
      expect(archiveRepository.upsert).toHaveBeenCalledWith(
        {
          userId: "user-1",
          threadKind: "support",
          threadId: "cr-1",
        },
        undefined,
      );
    });

    it("reservation group thread id -> accepted by reservation thread parser", async () => {
      // Arrange
      const archiveRepository = makeArchiveRepository();
      const service = new ChatInboxService({} as never, archiveRepository);
      vi.spyOn(
        service as unknown as {
          assertViewerAccess: (...args: unknown[]) => Promise<void>;
        },
        "assertViewerAccess",
      ).mockResolvedValue(undefined);

      // Act
      await service.archiveThread(viewer, {
        threadKind: "reservation",
        threadId: "grp-group-1",
      });

      // Assert
      expect(archiveRepository.upsert).toHaveBeenCalledWith(
        {
          userId: "user-1",
          threadKind: "reservation",
          threadId: "grp-group-1",
        },
        undefined,
      );
    });

    it("reservation thread + manager with reservation.chat -> archives successfully", async () => {
      // Arrange
      const archiveRepository = makeArchiveRepository();
      const db = makeDbWithQueryResults([
        [
          {
            reservationId: "r-1",
            organizationId: "org-1",
            ownerUserId: "owner-1",
            playerUserId: "player-1",
          },
        ],
      ]);
      const organizationMemberService = {
        hasOrganizationPermission: vi.fn(async () => true),
      };
      const service = new ChatInboxService(
        db as never,
        archiveRepository,
        organizationMemberService,
      );

      // Act
      const result = await service.archiveThread(
        { userId: "manager-1", role: "member" },
        {
          threadKind: "reservation",
          threadId: "res-r-1",
        },
      );

      // Assert
      expect(result).toEqual({ ok: true });
      expect(archiveRepository.upsert).toHaveBeenCalledWith(
        {
          userId: "manager-1",
          threadKind: "reservation",
          threadId: "res-r-1",
        },
        undefined,
      );
      expect(
        organizationMemberService.hasOrganizationPermission,
      ).toHaveBeenCalledWith(
        "manager-1",
        "org-1",
        "reservation.chat",
        undefined,
      );
    });
  });

  describe("unarchiveThread", () => {
    it("authorized request -> removes archive row", async () => {
      // Arrange
      const archiveRepository = makeArchiveRepository();
      const service = new ChatInboxService({} as never, archiveRepository);
      vi.spyOn(
        service as unknown as {
          assertViewerAccess: (...args: unknown[]) => Promise<void>;
        },
        "assertViewerAccess",
      ).mockResolvedValue(undefined);

      // Act
      const result = await service.unarchiveThread(viewer, {
        threadKind: "reservation",
        threadId: "res-1",
      });

      // Assert
      expect(result).toEqual({ ok: true });
      expect(archiveRepository.removeByThread).toHaveBeenCalledWith(
        "user-1",
        "reservation",
        "res-1",
        undefined,
      );
    });
  });

  describe("listArchivedThreadIds", () => {
    it("returns repository values", async () => {
      // Arrange
      const archiveRepository = makeArchiveRepository();
      const service = new ChatInboxService({} as never, archiveRepository);

      // Act
      const result = await service.listArchivedThreadIds(viewer, {
        threadKind: "reservation" as ChatInboxThreadKind,
      });

      // Assert
      expect(result).toEqual({ threadIds: ["res-1"] });
      expect(archiveRepository.listThreadIdsByKind).toHaveBeenCalledWith(
        "user-1",
        "reservation",
        undefined,
      );
    });
  });
});
