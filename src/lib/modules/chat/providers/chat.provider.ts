import type { ChatProviderId, ChatUser } from "../types";

export interface EnsureDmChannelInput {
  channelId: string;
  createdById: string;
  memberIds: string[];
}

/**
 * Provider abstraction to keep chat backend swappable (e.g. Stream now, self-hosted later).
 */
export interface IChatProvider {
  providerId: ChatProviderId;
  apiKey: string;
  ensureUsers(users: ChatUser[]): Promise<void>;
  createUserToken(userId: string): Promise<string>;
  ensureDmChannel(input: EnsureDmChannelInput): Promise<void>;
}
