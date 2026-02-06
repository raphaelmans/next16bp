import { StreamChat } from "stream-chat";
import { ChatProviderNotConfiguredError } from "../errors/chat.errors";
import type { ChatTranscriptExport, ChatUser } from "../types";
import type {
  EnsureDmChannelInput,
  EnsureReservationChannelInput,
  EnsureSupportChannelInput,
  IChatProvider,
  SendReservationMessageInput,
} from "./chat.provider";

function isDuplicateMessageError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code =
    "code" in error && typeof error.code === "number" ? error.code : null;
  const statusCode =
    "status" in error && typeof error.status === "number" ? error.status : null;
  const message =
    "message" in error && typeof error.message === "string"
      ? error.message.toLowerCase()
      : "";

  return (
    code === 4 ||
    statusCode === 409 ||
    message.includes("already exists") ||
    message.includes("duplicate")
  );
}

export class StreamChatProvider implements IChatProvider {
  readonly providerId = "stream" as const;
  readonly apiKey: string;
  private readonly client: StreamChat;

  constructor(apiKey?: string, apiSecret?: string) {
    if (!apiKey || !apiSecret) {
      throw new ChatProviderNotConfiguredError(
        "STREAM_CHAT_API_KEY and STREAM_CHAT_API_SECRET are required",
      );
    }

    this.apiKey = apiKey;
    this.client = new StreamChat(apiKey, apiSecret, { disableCache: true });
  }

  async ensureUsers(users: ChatUser[]): Promise<void> {
    if (users.length === 0) {
      return;
    }

    const uniqueUsers = new Map<string, ChatUser>();
    for (const user of users) {
      uniqueUsers.set(user.id, user);
    }

    await this.client.upsertUsers([...uniqueUsers.values()]);
  }

  async createUserToken(userId: string): Promise<string> {
    return this.client.createToken(userId);
  }

  async ensureDmChannel({
    channelId,
    createdById,
    memberIds,
  }: EnsureDmChannelInput): Promise<void> {
    const channels = await this.client.queryChannels(
      {
        type: "messaging",
        id: { $eq: channelId },
      },
      {},
      { limit: 1 },
    );

    if (channels.length > 0) {
      return;
    }

    const channel = this.client.channel("messaging", channelId, {
      created_by_id: createdById,
      members: memberIds,
    });

    await channel.create();
  }

  async ensureReservationChannel({
    reservationId,
    channelId,
    createdById,
    memberIds,
  }: EnsureReservationChannelInput): Promise<void> {
    const channels = await this.client.queryChannels(
      {
        type: "messaging",
        id: { $eq: channelId },
      },
      {},
      { limit: 1 },
    );

    if (channels.length > 0) {
      return;
    }

    const channel = this.client.channel("messaging", channelId, {
      created_by_id: createdById,
      members: memberIds,
      reservation_id: reservationId,
    } as unknown as Record<string, unknown>);

    await channel.create();
  }

  async sendReservationMessage({
    channelId,
    createdById,
    text,
    messageId,
  }: SendReservationMessageInput): Promise<void> {
    const channel = this.client.channel("messaging", channelId);
    try {
      await channel.sendMessage({
        id: messageId,
        text,
        user_id: createdById,
      });
    } catch (error) {
      if (isDuplicateMessageError(error)) {
        return;
      }
      throw error;
    }
  }

  async ensureSupportChannel({
    channelId,
    createdById,
    memberIds,
    data,
  }: EnsureSupportChannelInput): Promise<void> {
    const channels = await this.client.queryChannels(
      {
        type: "messaging",
        id: { $eq: channelId },
      },
      {},
      { limit: 1 },
    );

    if (channels.length > 0) {
      const channel = channels[0];
      const existingMemberIds = new Set(
        Object.keys(channel.state.members ?? {}),
      );
      const missing = memberIds.filter((id) => !existingMemberIds.has(id));
      if (missing.length > 0) {
        await channel.addMembers(missing);
      }
      return;
    }

    const channel = this.client.channel("messaging", channelId, {
      created_by_id: createdById,
      members: memberIds,
      ...(data ?? {}),
    } as unknown as Record<string, unknown>);

    await channel.create();
  }

  async exportReservationChannelMessages(input: {
    reservationId: string;
    channelId: string;
    channelType: string;
    limit?: number;
    maxMessages?: number;
  }): Promise<ChatTranscriptExport> {
    const limit = input.limit ?? 50;
    const maxMessages = input.maxMessages ?? 5000;

    const channel = this.client.channel(input.channelType, input.channelId);

    const messages: unknown[] = [];
    let lastId: string | undefined;

    const toIsoString = (value: unknown): string | null => {
      if (!value) return null;
      if (value instanceof Date) return value.toISOString();
      if (typeof value === "string") {
        // Stream typically returns ISO strings; normalize.
        return new Date(value).toISOString();
      }
      return null;
    };

    while (messages.length < maxMessages) {
      const remaining = maxMessages - messages.length;
      const pageLimit = Math.min(limit, remaining);

      const response = await (
        channel as unknown as {
          query: (args: unknown) => Promise<{ messages?: unknown[] }>;
        }
      ).query({
        messages: {
          limit: pageLimit,
          ...(lastId ? { id_lt: lastId } : {}),
        },
      });

      const page = response?.messages ?? [];
      if (page.length === 0) {
        break;
      }

      messages.push(...page);
      const last = page[page.length - 1];
      lastId =
        typeof (last as { id?: unknown } | null)?.id === "string"
          ? (last as { id: string }).id
          : undefined;

      if (!lastId || page.length < pageLimit) {
        break;
      }
    }

    return {
      providerId: this.providerId,
      channelType: input.channelType,
      channelId: input.channelId,
      reservationId: input.reservationId,
      messages: messages.map((m) => {
        const msg = m as Record<string, unknown>;
        const user = msg.user as Record<string, unknown> | undefined;
        return {
          id: typeof msg.id === "string" ? msg.id : String(msg.id),
          text: typeof msg.text === "string" ? msg.text : null,
          userId: typeof user?.id === "string" ? (user.id as string) : null,
          createdAt: toIsoString(msg.created_at),
          updatedAt: toIsoString(msg.updated_at),
          deletedAt: toIsoString(msg.deleted_at),
          attachments: Array.isArray(msg.attachments)
            ? (msg.attachments as unknown[])
            : [],
          raw: m,
        };
      }),
    };
  }
}
