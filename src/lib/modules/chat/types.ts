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

export interface ReservationChatChannelResult {
  providerId: ChatProviderId;
  channelType: string;
  channelId: string;
  memberIds: string[];
}

export interface ChatExportedMessage {
  id: string;
  text: string | null;
  userId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
  attachments: unknown[];
  raw: unknown;
}

export interface ChatTranscriptExport {
  providerId: ChatProviderId;
  channelType: string;
  channelId: string;
  reservationId: string;
  messages: ChatExportedMessage[];
}

export interface ReservationChatMeta {
  reservation: {
    id: string;
    status: string;
    startTimeIso: string;
    endTimeIso: string;
  };
  reservationGroup?: {
    id: string;
    itemCount: number;
  };
  place: {
    id: string;
    name: string;
    timeZone: string;
  };
  court: {
    id: string;
    label: string;
  };
  participants: {
    player: {
      userId: string;
      displayName: string;
    };
    owner: {
      userId: string;
      displayName: string;
    };
  };
}
