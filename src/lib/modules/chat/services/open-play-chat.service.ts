import type { IOpenPlayRepository } from "@/lib/modules/open-play/repositories/open-play.repository";
import type { IOpenPlayParticipantRepository } from "@/lib/modules/open-play/repositories/open-play-participant.repository";
import type { RequestContext } from "@/lib/shared/kernel/context";
import { NotFoundError } from "@/lib/shared/kernel/errors";
import {
  OpenPlayChatNotAvailableError,
  OpenPlayChatNotParticipantError,
} from "../errors/open-play-chat.errors";
import { makeOpenPlayChannelId } from "../helpers/open-play-channel-id";
import type { IChatProvider } from "../providers/chat.provider";
import type { IOpenPlayChatThreadRepository } from "../repositories/open-play-chat-thread.repository";
import type { ChatAuthResult } from "../types";

export interface OpenPlayChatChannelResult {
  providerId: string;
  channelType: string;
  channelId: string;
  memberIds: string[];
}

export interface OpenPlayChatMeta {
  openPlay: {
    id: string;
    status: string;
    startsAtIso: string;
    endsAtIso: string;
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
  sport: {
    id: string;
    name: string;
  };
  host: {
    profileId: string;
    displayName: string;
  };
}

export class OpenPlayChatService {
  constructor(
    private openPlayRepository: IOpenPlayRepository,
    private openPlayParticipantRepository: IOpenPlayParticipantRepository,
    private openPlayChatThreadRepository: IOpenPlayChatThreadRepository,
    private chatProvider: IChatProvider,
  ) {}

  private async ensureThread(options: {
    openPlayId: string;
    memberIds: string[];
    createdByUserId: string;
    ctx?: RequestContext;
  }): Promise<OpenPlayChatChannelResult> {
    const channelType = "messaging";
    const channelId = makeOpenPlayChannelId(options.openPlayId);

    await this.chatProvider.ensureUsers(
      options.memberIds.map((id) => ({ id })),
    );
    await this.chatProvider.ensureSupportChannel({
      channelId,
      createdById: options.createdByUserId,
      memberIds: options.memberIds,
      data: {
        open_play_id: options.openPlayId,
      },
    });

    await this.openPlayChatThreadRepository.upsert(
      {
        openPlayId: options.openPlayId,
        providerId: this.chatProvider.providerId,
        providerChannelType: channelType,
        providerChannelId: channelId,
        createdByUserId: options.createdByUserId,
      },
      options.ctx,
    );

    return {
      providerId: this.chatProvider.providerId,
      channelType,
      channelId,
      memberIds: options.memberIds,
    };
  }

  private async getConfirmedMemberUserIds(
    openPlayId: string,
    ctx?: RequestContext,
  ): Promise<string[]> {
    const confirmed =
      await this.openPlayParticipantRepository.listWithProfilesByOpenPlayId(
        openPlayId,
        ["CONFIRMED"],
        ctx,
      );

    const ids = confirmed.map((p) => p.profile.userId);
    return Array.from(new Set(ids));
  }

  async getSession(
    userId: string,
    openPlayId: string,
    user: { id: string; name?: string; image?: string },
    ctx?: RequestContext,
  ): Promise<{
    auth: ChatAuthResult;
    channel: OpenPlayChatChannelResult;
    meta: OpenPlayChatMeta;
  }> {
    const context = await this.openPlayRepository.getDetailContext(
      openPlayId,
      new Date(),
      ctx,
    );
    if (!context) {
      throw new NotFoundError("Open Play not found", { openPlayId });
    }

    if (context.reservationStatus !== "CONFIRMED") {
      throw new OpenPlayChatNotAvailableError("reservation_not_confirmed");
    }

    if (context.openPlay.status === "CANCELLED") {
      throw new OpenPlayChatNotAvailableError("open_play_cancelled");
    }

    const memberIds = await this.getConfirmedMemberUserIds(openPlayId, ctx);
    if (!memberIds.includes(userId)) {
      throw new OpenPlayChatNotParticipantError(openPlayId);
    }

    const channel = await this.ensureThread({
      openPlayId,
      memberIds,
      createdByUserId: userId,
      ctx,
    });

    const token = await this.chatProvider.createUserToken(userId);

    return {
      auth: {
        apiKey: this.chatProvider.apiKey,
        user,
        token,
      },
      channel,
      meta: {
        openPlay: {
          id: context.openPlay.id,
          status: context.openPlay.status,
          startsAtIso: new Date(context.openPlay.startsAt).toISOString(),
          endsAtIso: new Date(context.openPlay.endsAt).toISOString(),
        },
        place: context.place,
        court: context.court,
        sport: context.sport,
        host: {
          profileId: context.host.profileId,
          displayName: context.host.displayName ?? "Host",
        },
      },
    };
  }

  async sendMessage(
    userId: string,
    openPlayId: string,
    message: {
      text?: string;
      attachments?: Array<{
        type?: string;
        asset_url?: string;
        image_url?: string;
        thumb_url?: string;
        title?: string;
        file_size?: number;
        mime_type?: string;
      }>;
      messageId?: string;
    },
    ctx?: RequestContext,
  ): Promise<void> {
    const memberIds = await this.getConfirmedMemberUserIds(openPlayId, ctx);
    if (!memberIds.includes(userId)) {
      throw new OpenPlayChatNotParticipantError(openPlayId);
    }

    const channel = await this.ensureThread({
      openPlayId,
      memberIds,
      createdByUserId: userId,
      ctx,
    });

    await this.chatProvider.sendMessage({
      channelType: channel.channelType,
      channelId: channel.channelId,
      createdById: userId,
      text: message.text,
      attachments: message.attachments,
      messageId: message.messageId,
    });
  }

  async removeMember(openPlayId: string, userId: string, ctx?: RequestContext) {
    const thread = await this.openPlayChatThreadRepository.findByOpenPlayId(
      openPlayId,
      ctx,
    );
    if (!thread) {
      return;
    }

    await this.chatProvider.removeMembersFromChannel({
      channelType: thread.providerChannelType,
      channelId: thread.providerChannelId,
      memberIds: [userId],
    });
  }
}
