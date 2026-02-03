import { ChatInvalidMembersError } from "../errors/chat.errors";
import { makeDmChannelId } from "../helpers/dm-channel-id";
import type { IChatProvider } from "../providers/chat.provider";
import type { ChatAuthResult, ChatUser, DmChannelResult } from "../types";

interface DmInput {
  userId: string;
  otherUserId: string;
}

export class ChatService {
  constructor(private readonly provider: IChatProvider) {}

  async getAuth(user: ChatUser): Promise<ChatAuthResult> {
    await this.provider.ensureUsers([user]);
    const token = await this.provider.createUserToken(user.id);

    return {
      apiKey: this.provider.apiKey,
      user,
      token,
    };
  }

  async getOrCreateDm({
    userId,
    otherUserId,
  }: DmInput): Promise<DmChannelResult> {
    if (userId === otherUserId) {
      throw new ChatInvalidMembersError([userId, otherUserId]);
    }

    const channelId = makeDmChannelId(userId, otherUserId);
    const memberIds = [userId, otherUserId];

    await this.provider.ensureUsers([{ id: userId }, { id: otherUserId }]);
    await this.provider.ensureDmChannel({
      channelId,
      createdById: userId,
      memberIds,
    });

    return {
      channelId,
      memberIds,
    };
  }
}
