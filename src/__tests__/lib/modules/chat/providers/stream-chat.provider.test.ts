import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  queryChannelsMock,
  channelFactoryMock,
  upsertUsersMock,
  createTokenMock,
} = vi.hoisted(() => ({
  queryChannelsMock: vi.fn(),
  channelFactoryMock: vi.fn(),
  upsertUsersMock: vi.fn(),
  createTokenMock: vi.fn((userId: string) => `token-${userId}`),
}));

vi.mock("stream-chat", () => ({
  StreamChat: class MockStreamChat {
    queryChannels = queryChannelsMock;
    channel = channelFactoryMock;
    upsertUsers = upsertUsersMock;
    createToken = createTokenMock;
  },
}));

import { StreamChatProvider } from "@/lib/modules/chat/providers/stream-chat.provider";

describe("StreamChatProvider.ensureReservationChannel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryChannelsMock.mockResolvedValue([]);
  });

  it("existing channel + missing members -> adds missing members", async () => {
    // Arrange
    const addMembers = vi.fn(async () => undefined);
    queryChannelsMock.mockResolvedValue([
      {
        state: {
          members: {
            "player-1": {},
            "owner-1": {},
          },
        },
        addMembers,
      },
    ]);
    const provider = new StreamChatProvider("api-key", "api-secret");

    // Act
    await provider.ensureReservationChannel({
      reservationId: "r-1",
      channelId: "res-r-1",
      createdById: "owner-1",
      memberIds: ["player-1", "owner-1", "manager-1"],
    });

    // Assert
    expect(addMembers).toHaveBeenCalledWith(["manager-1"]);
    expect(channelFactoryMock).not.toHaveBeenCalled();
  });

  it("existing channel + duplicate missing members -> adds each member once", async () => {
    // Arrange
    const addMembers = vi.fn(async () => undefined);
    queryChannelsMock.mockResolvedValue([
      {
        state: {
          members: {
            "player-1": {},
          },
        },
        addMembers,
      },
    ]);
    const provider = new StreamChatProvider("api-key", "api-secret");

    // Act
    await provider.ensureReservationChannel({
      reservationId: "r-1",
      channelId: "res-r-1",
      createdById: "owner-1",
      memberIds: ["player-1", "owner-1", "owner-1", "manager-1", "manager-1"],
    });

    // Assert
    expect(addMembers).toHaveBeenCalledWith(["owner-1", "manager-1"]);
    expect(channelFactoryMock).not.toHaveBeenCalled();
  });

  it("existing channel + all members present -> no addMembers call", async () => {
    // Arrange
    const addMembers = vi.fn(async () => undefined);
    queryChannelsMock.mockResolvedValue([
      {
        state: {
          members: {
            "player-1": {},
            "owner-1": {},
          },
        },
        addMembers,
      },
    ]);
    const provider = new StreamChatProvider("api-key", "api-secret");

    // Act
    await provider.ensureReservationChannel({
      reservationId: "r-1",
      channelId: "res-r-1",
      createdById: "owner-1",
      memberIds: ["player-1", "owner-1"],
    });

    // Assert
    expect(addMembers).not.toHaveBeenCalled();
    expect(channelFactoryMock).not.toHaveBeenCalled();
  });

  it("existing channel + addMembers conflict -> treats as idempotent success", async () => {
    // Arrange
    const addMembers = vi.fn(async () => {
      throw { status: 409 };
    });
    queryChannelsMock.mockResolvedValue([
      {
        state: {
          members: {
            "player-1": {},
          },
        },
        addMembers,
      },
    ]);
    const provider = new StreamChatProvider("api-key", "api-secret");

    // Act + Assert
    await expect(
      provider.ensureReservationChannel({
        reservationId: "r-1",
        channelId: "res-r-1",
        createdById: "owner-1",
        memberIds: ["player-1", "owner-1"],
      }),
    ).resolves.toBeUndefined();
  });

  it("missing channel -> creates reservation channel with reservation metadata", async () => {
    // Arrange
    const create = vi.fn(async () => undefined);
    channelFactoryMock.mockReturnValue({ create });
    const provider = new StreamChatProvider("api-key", "api-secret");

    // Act
    await provider.ensureReservationChannel({
      reservationId: "r-1",
      channelId: "res-r-1",
      createdById: "owner-1",
      memberIds: ["player-1", "owner-1"],
    });

    // Assert
    expect(channelFactoryMock).toHaveBeenCalledWith("messaging", "res-r-1", {
      created_by_id: "owner-1",
      members: ["player-1", "owner-1"],
      reservation_id: "r-1",
    });
    expect(create).toHaveBeenCalled();
  });
});
