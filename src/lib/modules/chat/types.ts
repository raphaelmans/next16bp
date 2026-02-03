export type ChatProviderId = "stream";

export interface ChatUser {
  id: string;
  name?: string;
  image?: string;
}

export interface ChatAuthResult {
  apiKey: string;
  user: ChatUser;
  token: string;
}

export interface DmChannelResult {
  channelId: string;
  memberIds: string[];
}
