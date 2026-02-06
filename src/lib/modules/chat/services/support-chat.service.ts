import type { IClaimRequestRepository } from "@/lib/modules/claim-request/repositories/claim-request.repository";
import { PlaceNotFoundError } from "@/lib/modules/place/errors/place.errors";
import type { IPlaceRepository } from "@/lib/modules/place/repositories/place.repository";
import type { IPlaceVerificationRequestRepository } from "@/lib/modules/place-verification/repositories/place-verification.repository";
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
import type { IChatProvider } from "../providers/chat.provider";
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
  ) {}

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

    const channelId = makeClaimSupportChannelId(claim.id);
    const channelType = "messaging";

    const memberIds = isAdmin
      ? Array.from(new Set([ownerUserId, options.viewerUserId]))
      : [ownerUserId];

    await this.chatProvider.ensureUsers([
      { id: ownerUserId },
      { id: options.viewerUserId, name: options.viewer.name },
    ]);
    await this.chatProvider.ensureSupportChannel({
      channelId,
      createdById: options.viewerUserId,
      memberIds,
      data: {
        claim_request_id: claim.id,
        place_id: claim.placeId,
      },
    });

    await this.supportChatThreadRepository.upsertClaimThread(
      {
        claimRequestId: claim.id,
        providerId: this.chatProvider.providerId,
        providerChannelType: channelType,
        providerChannelId: channelId,
        createdByUserId: options.viewerUserId,
      },
      options.reqCtx,
    );

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

    const channelId = makeVerificationSupportChannelId(request.id);
    const channelType = "messaging";

    const memberIds = isAdmin
      ? Array.from(new Set([ownerUserId, options.viewerUserId]))
      : [ownerUserId];

    await this.chatProvider.ensureUsers([
      { id: ownerUserId },
      { id: options.viewerUserId, name: options.viewer.name },
    ]);
    await this.chatProvider.ensureSupportChannel({
      channelId,
      createdById: options.viewerUserId,
      memberIds,
      data: {
        place_verification_request_id: request.id,
        place_id: request.placeId,
      },
    });

    await this.supportChatThreadRepository.upsertVerificationThread(
      {
        placeVerificationRequestId: request.id,
        providerId: this.chatProvider.providerId,
        providerChannelType: channelType,
        providerChannelId: channelId,
        createdByUserId: options.viewerUserId,
      },
      options.reqCtx,
    );

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
}
