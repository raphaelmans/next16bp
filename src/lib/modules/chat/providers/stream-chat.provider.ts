import { StreamChat } from "stream-chat";
import { ChatProviderNotConfiguredError } from "../errors/chat.errors";
import type { ChatUser } from "../types";
import type { EnsureDmChannelInput, IChatProvider } from "./chat.provider";

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
}
