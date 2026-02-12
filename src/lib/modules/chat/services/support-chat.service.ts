import type { IClaimRequestRepository } from "@/lib/modules/claim-request/repositories/claim-request.repository";
import type { INotificationRecipientRepository } from "@/lib/modules/notification-delivery/repositories/notification-recipient.repository";
import { PlaceNotFoundError } from "@/lib/modules/place/errors/place.errors";
import type { IPlaceRepository } from "@/lib/modules/place/repositories/place.repository";
import type { IPlaceVerificationRequestRepository } from "@/lib/modules/place-verification/repositories/place-verification.repository";
import type { ClaimRequestRecord } from "@/lib/shared/infra/db/schema";
import type { AuthenticatedContext } from "@/lib/shared/infra/trpc/context";
import type { RequestContext } from "@/lib/shared/kernel/context";
import {
  SupportChatClaimRequestNotEligibleError,
  SupportChatClaimRequestNotFoundError,
  SupportChatNotAllowedError,
  SupportChatVerificationRequestNotFoundError,
} from "../errors/support-chat.errors";
import { makeClaimSupportChannelId } from "../helpers/claim-support-channel-id";
import { makeVerificationSupportChannelId } from "../helpers/verification-support-channel-id";
import type {
  ChatMessageAttachmentInput,
  IChatProvider,
} from "../providers/chat.provider";
import type { ISupportChatThreadRepository } from "../repositories/support-chat-thread.repository";

export type SupportChatKind = "claim" | "verification";

export type SupportChatSession = {
  auth: {
    apiKey: string;
    user: { id: string; name?: string };
    token: string;
  };
  channel: {
    channelType: string;
    channelId: string;
    memberIds: string[];
  };
  meta: {
    kind: SupportChatKind;
    requestId: string;
    placeId: string;
    placeName: string;
  };
};

export class SupportChatService {
  constructor(
    private claimRequestRepository: IClaimRequestRepository,
    private placeVerificationRequestRepository: IPlaceVerificationRequestRepository,
    private placeRepository: IPlaceRepository,
    private supportChatThreadRepository: ISupportChatThreadRepository,
    private chatProvider: IChatProvider,
    private notificationRecipientRepository: INotificationRecipientRepository,
  ) {}

  private async resolveClaimMemberIds(options: {
    ownerUserId: string;
    reqCtx?: RequestContext;
  }): Promise<string[]> {
    const adminRecipients =
      await this.notificationRecipientRepository.findAdminRecipients(
        options.reqCtx,
      );
    return Array.from(
      new Set([
        options.ownerUserId,
        ...adminRecipients.map((recipient) => recipient.userId),
      ]),
    );
  }

  private async ensureClaimThread(options: {
    claim: ClaimRequestRecord;
    createdByUserId: string;
    reqCtx?: RequestContext;
  }): Promise<{ channelType: string; channelId: string; memberIds: string[] }> {
    const ownerUserId = options.claim.requestedByUserId;
    if (!ownerUserId) {
      throw new SupportChatClaimRequestNotEligibleError(options.claim.id);
    }

    const channelId = makeClaimSupportChannelId(options.claim.id);
    const channelType = "messaging";
    const memberIds = await this.resolveClaimMemberIds({
      ownerUserId,
      reqCtx: options.reqCtx,
    });

    await this.chatProvider.ensureUsers(memberIds.map((id) => ({ id })));

    await this.chatProvider.ensureSupportChannel({
      channelId,
      createdById: options.createdByUserId,
      memberIds,
      data: {
        claim_request_id: options.claim.id,
        place_id: options.claim.placeId,
      },
    });

    await this.supportChatThreadRepository.upsertClaimThread(
      {
        claimRequestId: options.claim.id,
        providerId: this.chatProvider.providerId,
        providerChannelType: channelType,
        providerChannelId: channelId,
        createdByUserId: options.createdByUserId,
      },
      options.reqCtx,
    );

    return {
      channelType,
      channelId,
      memberIds,
    };
  }

  private async ensureVerificationThread(options: {
    placeVerificationRequestId: string;
    placeId: string;
    createdByUserId: string;
    memberIds: string[];
    reqCtx?: RequestContext;
  }): Promise<{ channelType: string; channelId: string; memberIds: string[] }> {
    const channelId = makeVerificationSupportChannelId(
      options.placeVerificationRequestId,
    );
    const channelType = "messaging";

    await this.chatProvider.ensureUsers(
      options.memberIds.map((id) => ({ id })),
    );
    await this.chatProvider.ensureSupportChannel({
      channelId,
      createdById: options.createdByUserId,
      memberIds: options.memberIds,
      data: {
        place_verification_request_id: options.placeVerificationRequestId,
        place_id: options.placeId,
      },
    });

    await this.supportChatThreadRepository.upsertVerificationThread(
      {
        placeVerificationRequestId: options.placeVerificationRequestId,
        providerId: this.chatProvider.providerId,
        providerChannelType: channelType,
        providerChannelId: channelId,
        createdByUserId: options.createdByUserId,
      },
      options.reqCtx,
    );

    return {
      channelType,
      channelId,
      memberIds: options.memberIds,
    };
  }

  async provisionClaimThread(options: {
    claimRequestId: string;
    createdByUserId: string;
    reqCtx?: RequestContext;
  }): Promise<{ channelType: string; channelId: string; memberIds: string[] }> {
    const claim = await this.claimRequestRepository.findById(
      options.claimRequestId,
      options.reqCtx,
    );
    if (!claim) {
      throw new SupportChatClaimRequestNotFoundError(options.claimRequestId);
    }

    return this.ensureClaimThread({
      claim,
      createdByUserId: options.createdByUserId,
      reqCtx: options.reqCtx,
    });
  }

  async backfillPendingClaimThreads(options: {
    createdByUserId: string;
    reqCtx?: RequestContext;
  }): Promise<{ processed: number; skipped: number; failed: number }> {
    const pageSize = 100;
    let offset = 0;
    let processed = 0;
    let skipped = 0;
    let failed = 0;

    while (true) {
      const result = await this.claimRequestRepository.findPending(
        { limit: pageSize, offset },
        options.reqCtx,
      );

      if (result.items.length === 0) {
        break;
      }

      for (const claim of result.items) {
        if (!claim.requestedByUserId) {
          skipped += 1;
          continue;
        }

        try {
          await this.ensureClaimThread({
            claim,
            createdByUserId: options.createdByUserId,
            reqCtx: options.reqCtx,
          });
          processed += 1;
        } catch {
          failed += 1;
        }
      }

      offset += result.items.length;
      if (offset >= result.total) {
        break;
      }
    }

    return { processed, skipped, failed };
  }

  async getClaimSession(options: {
    viewerUserId: string;
    viewer: { id: string; name?: string };
    claimRequestId: string;
    ctx: AuthenticatedContext;
    reqCtx?: RequestContext;
  }): Promise<SupportChatSession> {
    const claim = await this.claimRequestRepository.findById(
      options.claimRequestId,
      options.reqCtx,
    );
    if (!claim) {
      throw new SupportChatClaimRequestNotFoundError(options.claimRequestId);
    }

    const ownerUserId = claim.requestedByUserId;
    if (!ownerUserId) {
      throw new SupportChatClaimRequestNotEligibleError(options.claimRequestId);
    }

    const isAdmin = options.ctx.session.role === "admin";
    const isOwner = ownerUserId === options.viewerUserId;
    if (!isAdmin && !isOwner) {
      throw new SupportChatNotAllowedError();
    }

    const place = await this.placeRepository.findById(
      claim.placeId,
      options.reqCtx,
    );
    if (!place) {
      throw new PlaceNotFoundError(claim.placeId);
    }

    const { channelId, channelType, memberIds } = await this.ensureClaimThread({
      claim,
      createdByUserId: options.viewerUserId,
      reqCtx: options.reqCtx,
    });

    const token = await this.chatProvider.createUserToken(options.viewerUserId);

    return {
      auth: {
        apiKey: this.chatProvider.apiKey,
        user: options.viewer,
        token,
      },
      channel: {
        channelType,
        channelId,
        memberIds,
      },
      meta: {
        kind: "claim",
        requestId: claim.id,
        placeId: place.id,
        placeName: place.name,
      },
    };
  }

  async getVerificationSession(options: {
    viewerUserId: string;
    viewer: { id: string; name?: string };
    placeVerificationRequestId: string;
    ctx: AuthenticatedContext;
    reqCtx?: RequestContext;
  }): Promise<SupportChatSession> {
    const request = await this.placeVerificationRequestRepository.findById(
      options.placeVerificationRequestId,
      options.reqCtx,
    );
    if (!request) {
      throw new SupportChatVerificationRequestNotFoundError(
        options.placeVerificationRequestId,
      );
    }

    const ownerUserId = request.requestedByUserId;
    const isAdmin = options.ctx.session.role === "admin";
    const isOwner = ownerUserId === options.viewerUserId;
    if (!isAdmin && !isOwner) {
      throw new SupportChatNotAllowedError();
    }

    const place = await this.placeRepository.findById(
      request.placeId,
      options.reqCtx,
    );
    if (!place) {
      throw new PlaceNotFoundError(request.placeId);
    }

    const memberIds = isAdmin
      ? Array.from(new Set([ownerUserId, options.viewerUserId]))
      : [ownerUserId];

    const { channelId, channelType } = await this.ensureVerificationThread({
      placeVerificationRequestId: request.id,
      placeId: request.placeId,
      createdByUserId: options.viewerUserId,
      memberIds,
      reqCtx: options.reqCtx,
    });

    const token = await this.chatProvider.createUserToken(options.viewerUserId);

    return {
      auth: {
        apiKey: this.chatProvider.apiKey,
        user: options.viewer,
        token,
      },
      channel: {
        channelType,
        channelId,
        memberIds,
      },
      meta: {
        kind: "verification",
        requestId: request.id,
        placeId: place.id,
        placeName: place.name,
      },
    };
  }

  async sendClaimMessage(options: {
    viewerUserId: string;
    claimRequestId: string;
    text?: string;
    attachments?: ChatMessageAttachmentInput[];
    ctx: AuthenticatedContext;
    reqCtx?: RequestContext;
  }): Promise<void> {
    const claim = await this.claimRequestRepository.findById(
      options.claimRequestId,
      options.reqCtx,
    );
    if (!claim) {
      throw new SupportChatClaimRequestNotFoundError(options.claimRequestId);
    }

    const ownerUserId = claim.requestedByUserId;
    if (!ownerUserId) {
      throw new SupportChatClaimRequestNotEligibleError(options.claimRequestId);
    }

    const isAdmin = options.ctx.session.role === "admin";
    const isOwner = ownerUserId === options.viewerUserId;
    if (!isAdmin && !isOwner) {
      throw new SupportChatNotAllowedError();
    }

    const { channelId, channelType } = await this.ensureClaimThread({
      claim,
      createdByUserId: options.viewerUserId,
      reqCtx: options.reqCtx,
    });

    await this.chatProvider.sendMessage({
      channelType,
      channelId,
      createdById: options.viewerUserId,
      text: options.text,
      attachments: options.attachments,
    });
  }

  async sendVerificationMessage(options: {
    viewerUserId: string;
    placeVerificationRequestId: string;
    text?: string;
    attachments?: ChatMessageAttachmentInput[];
    ctx: AuthenticatedContext;
    reqCtx?: RequestContext;
  }): Promise<void> {
    const request = await this.placeVerificationRequestRepository.findById(
      options.placeVerificationRequestId,
      options.reqCtx,
    );
    if (!request) {
      throw new SupportChatVerificationRequestNotFoundError(
        options.placeVerificationRequestId,
      );
    }

    const ownerUserId = request.requestedByUserId;
    const isAdmin = options.ctx.session.role === "admin";
    const isOwner = ownerUserId === options.viewerUserId;
    if (!isAdmin && !isOwner) {
      throw new SupportChatNotAllowedError();
    }

    const memberIds = isAdmin
      ? Array.from(new Set([ownerUserId, options.viewerUserId]))
      : [ownerUserId];

    const { channelId, channelType } = await this.ensureVerificationThread({
      placeVerificationRequestId: request.id,
      placeId: request.placeId,
      createdByUserId: options.viewerUserId,
      memberIds,
      reqCtx: options.reqCtx,
    });

    await this.chatProvider.sendMessage({
      channelType,
      channelId,
      createdById: options.viewerUserId,
      text: options.text,
      attachments: options.attachments,
    });
  }
}
