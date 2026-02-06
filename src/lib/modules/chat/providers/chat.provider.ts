import type { ChatProviderId, ChatTranscriptExport, ChatUser } from "../types";

export interface EnsureDmChannelInput {
  channelId: string;
  createdById: string;
  memberIds: string[];
}

export interface EnsureReservationChannelInput {
  reservationId: string;
  channelId: string;
  createdById: string;
  memberIds: string[];
}

export interface SendReservationMessageInput {
  reservationId: string;
  channelId: string;
  createdById: string;
  text: string;
  messageId?: string;
}

export interface EnsureSupportChannelInput {
  channelId: string;
  createdById: string;
  memberIds: string[];
  data?: Record<string, unknown>;
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
  ensureReservationChannel(input: EnsureReservationChannelInput): Promise<void>;
  sendReservationMessage(input: SendReservationMessageInput): Promise<void>;
  ensureSupportChannel(input: EnsureSupportChannelInput): Promise<void>;
  exportReservationChannelMessages(input: {
    reservationId: string;
    channelId: string;
    channelType: string;
    limit?: number;
    maxMessages?: number;
  }): Promise<ChatTranscriptExport>;
}
