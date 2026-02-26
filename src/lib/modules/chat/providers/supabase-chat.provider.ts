import { eq, sql } from "drizzle-orm";
import { chatMessage } from "@/lib/shared/infra/db/schema";
import type { DbClient } from "@/lib/shared/infra/db/types";
import type { ChatTranscriptExport, ChatUser } from "../types";
import type {
  EnsureDmChannelInput,
  EnsureReservationChannelInput,
  EnsureSupportChannelInput,
  IChatProvider,
  SendChatMessageInput,
  SendReservationMessageInput,
} from "./chat.provider";

/**
 * Supabase-backed chat provider.
 *
 * Messages are stored in the `chat_message` table and delivered
 * to connected clients via Supabase Realtime postgres_changes.
 *
 * Channel/user management is a no-op since we own the data model
 * and use Supabase Auth for identity.
 */
export class SupabaseChatProvider implements IChatProvider {
  readonly providerId = "supabase" as const;
  readonly apiKey = "supabase";

  constructor(private readonly db: DbClient) {}

  async ensureUsers(_users: ChatUser[]): Promise<void> {
    // No-op: users are managed by Supabase Auth
  }

  async createUserToken(_userId: string): Promise<string> {
    // No-op: the Supabase browser client is already authenticated via session.
    // Return a placeholder token; client-side hooks use Supabase session directly.
    return "supabase-session";
  }

  async ensureDmChannel(_input: EnsureDmChannelInput): Promise<void> {
    // No-op: threads are implicit - a thread exists when messages exist.
    // Thread membership is validated at the service layer.
  }

  async ensureReservationChannel(
    _input: EnsureReservationChannelInput,
  ): Promise<void> {
    // No-op: reservation threads are implicit.
  }

  async removeMembersFromChannel(_input: {
    channelType: string;
    channelId: string;
    memberIds: string[];
  }): Promise<void> {
    // No-op: membership is determined by reservation context.
  }

  async sendMessage({
    channelId,
    createdById,
    text,
    attachments,
    messageId,
  }: SendChatMessageInput): Promise<void> {
    const mappedAttachments = (attachments ?? []).map((a) => ({
      type: a.type ?? "file",
      url: a.asset_url ?? a.image_url ?? a.thumb_url ?? "",
      filename: a.title,
      mimeType: a.mime_type,
      fileSize: a.file_size,
    }));

    await this.db
      .insert(chatMessage)
      .values({
        ...(messageId ? { id: messageId } : {}),
        threadId: channelId,
        senderUserId: createdById,
        content: text ?? null,
        attachments: mappedAttachments,
      })
      .onConflictDoNothing();
  }

  async sendReservationMessage({
    channelId,
    createdById,
    text,
    messageId,
  }: SendReservationMessageInput): Promise<void> {
    await this.sendMessage({
      channelType: "messaging",
      channelId,
      createdById,
      text,
      messageId,
    });
  }

  async ensureSupportChannel(_input: EnsureSupportChannelInput): Promise<void> {
    // No-op: support threads are implicit.
  }

  async exportReservationChannelMessages(input: {
    reservationId: string;
    channelId: string;
    channelType: string;
    limit?: number;
    maxMessages?: number;
  }): Promise<ChatTranscriptExport> {
    const maxMessages = input.maxMessages ?? 5000;

    const messages = await this.db
      .select()
      .from(chatMessage)
      .where(eq(chatMessage.threadId, input.channelId))
      .orderBy(sql`${chatMessage.createdAt} ASC`)
      .limit(maxMessages);

    return {
      providerId: this.providerId,
      channelType: input.channelType,
      channelId: input.channelId,
      reservationId: input.reservationId,
      messages: messages.map((m) => ({
        id: m.id,
        text: m.content,
        userId: m.senderUserId,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
        deletedAt: m.deletedAt?.toISOString() ?? null,
        attachments: Array.isArray(m.attachments)
          ? (m.attachments as unknown[])
          : [],
        raw: m,
      })),
    };
  }
}
