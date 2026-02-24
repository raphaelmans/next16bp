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

describe("ChatInboxService", () => {
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
      vi.spyOn(service as any, "assertViewerAccess").mockResolvedValue(
        undefined,
      );

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
      vi.spyOn(service as any, "assertViewerAccess").mockResolvedValue(
        undefined,
      );

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
  });

  describe("unarchiveThread", () => {
    it("authorized request -> removes archive row", async () => {
      // Arrange
      const archiveRepository = makeArchiveRepository();
      const service = new ChatInboxService({} as never, archiveRepository);
      vi.spyOn(service as any, "assertViewerAccess").mockResolvedValue(
        undefined,
      );

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
