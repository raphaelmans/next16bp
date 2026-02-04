import { createHash } from "node:crypto";
import { CourtNotFoundError } from "@/lib/modules/court/errors/court.errors";
import type { ICourtRepository } from "@/lib/modules/court/repositories/court.repository";
import { NotOrganizationOwnerError } from "@/lib/modules/organization/errors/organization.errors";
import type { IOrganizationRepository } from "@/lib/modules/organization/repositories/organization.repository";
import { PlaceNotFoundError } from "@/lib/modules/place/errors/place.errors";
import type { IPlaceRepository } from "@/lib/modules/place/repositories/place.repository";
import { ProfileNotFoundError } from "@/lib/modules/profile/errors/profile.errors";
import type { IProfileRepository } from "@/lib/modules/profile/repositories/profile.repository";
import { ReservationNotFoundError } from "@/lib/modules/reservation/errors/reservation.errors";
import type { IReservationRepository } from "@/lib/modules/reservation/repositories/reservation.repository";
import type { RequestContext } from "@/lib/shared/kernel/context";
import {
  ReservationChatGuestReservationNotSupportedError,
  ReservationChatNotAvailableError,
  ReservationChatNotParticipantError,
} from "../errors/reservation-chat.errors";
import { makeReservationChannelId } from "../helpers/reservation-channel-id";
import type { IChatProvider } from "../providers/chat.provider";
import type { IReservationChatThreadRepository } from "../repositories/reservation-chat-thread.repository";
import type { IReservationChatTranscriptRepository } from "../repositories/reservation-chat-transcript.repository";
import type { ChatAuthResult, ReservationChatChannelResult } from "../types";

const CHAT_ENABLED_STATUSES = [
  "CREATED",
  "AWAITING_PAYMENT",
  "PAYMENT_MARKED_BY_USER",
  "CONFIRMED",
] as const;

const isChatEnabledForStatus = (status: string): boolean =>
  (CHAT_ENABLED_STATUSES as readonly string[]).includes(status);

const stableStringify = (value: unknown): string => {
  if (value === null) return "null";
  if (typeof value === "number" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "string") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (value instanceof Date) {
    return JSON.stringify(value.toISOString());
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    return `{${keys
      .map((k) => `${JSON.stringify(k)}:${stableStringify(record[k])}`)
      .join(",")}}`;
  }

  return JSON.stringify(String(value));
};

export class ReservationChatService {
  constructor(
    private reservationRepository: IReservationRepository,
    private profileRepository: IProfileRepository,
    private courtRepository: ICourtRepository,
    private placeRepository: IPlaceRepository,
    private organizationRepository: IOrganizationRepository,
    private reservationChatThreadRepository: IReservationChatThreadRepository,
    private reservationChatTranscriptRepository: IReservationChatTranscriptRepository,
    private chatProvider: IChatProvider,
  ) {}

  private async getReservationParticipants(
    reservationId: string,
    ctx?: RequestContext,
  ): Promise<{ playerUserId: string; ownerUserId: string }> {
    const reservation = await this.reservationRepository.findById(
      reservationId,
      ctx,
    );
    if (!reservation) {
      throw new ReservationNotFoundError(reservationId);
    }

    if (!reservation.playerId) {
      throw new ReservationChatGuestReservationNotSupportedError(reservationId);
    }

    const profile = await this.profileRepository.findById(
      reservation.playerId,
      ctx,
    );
    if (!profile) {
      throw new ProfileNotFoundError(reservation.playerId);
    }

    const court = await this.courtRepository.findById(reservation.courtId, ctx);
    if (!court) {
      throw new CourtNotFoundError(reservation.courtId);
    }

    if (!court.placeId) {
      throw new PlaceNotFoundError();
    }

    const place = await this.placeRepository.findById(court.placeId, ctx);
    if (!place) {
      throw new PlaceNotFoundError(court.placeId);
    }

    if (!place.organizationId) {
      throw new NotOrganizationOwnerError();
    }

    const organization = await this.organizationRepository.findById(
      place.organizationId,
      ctx,
    );
    if (!organization || !organization.ownerUserId) {
      throw new NotOrganizationOwnerError();
    }

    return {
      playerUserId: profile.userId,
      ownerUserId: organization.ownerUserId,
    };
  }

  private async ensureThread(
    reservationId: string,
    memberIds: string[],
    createdByUserId: string,
    ctx?: RequestContext,
  ): Promise<ReservationChatChannelResult> {
    const channelType = "messaging";
    const channelId = makeReservationChannelId(reservationId);

    await this.chatProvider.ensureUsers(memberIds.map((id) => ({ id })));
    await this.chatProvider.ensureReservationChannel({
      reservationId,
      channelId,
      createdById: createdByUserId,
      memberIds,
    });

    await this.reservationChatThreadRepository.upsert(
      {
        reservationId,
        providerId: this.chatProvider.providerId,
        providerChannelType: channelType,
        providerChannelId: channelId,
        createdByUserId,
      },
      ctx,
    );

    return {
      providerId: this.chatProvider.providerId,
      channelType,
      channelId,
      memberIds,
    };
  }

  async getSession(
    userId: string,
    reservationId: string,
    user: { id: string; name?: string; image?: string },
    ctx?: RequestContext,
  ): Promise<{ auth: ChatAuthResult; channel: ReservationChatChannelResult }> {
    const reservation = await this.reservationRepository.findById(
      reservationId,
      ctx,
    );
    if (!reservation) {
      throw new ReservationNotFoundError(reservationId);
    }

    if (!isChatEnabledForStatus(reservation.status)) {
      throw new ReservationChatNotAvailableError(reservation.status);
    }

    const { playerUserId, ownerUserId } = await this.getReservationParticipants(
      reservationId,
      ctx,
    );

    const memberIds = [playerUserId, ownerUserId];
    if (!memberIds.includes(userId)) {
      throw new ReservationChatNotParticipantError(reservationId);
    }

    const channel = await this.ensureThread(
      reservationId,
      memberIds,
      userId,
      ctx,
    );

    const token = await this.chatProvider.createUserToken(userId);

    return {
      auth: {
        apiKey: this.chatProvider.apiKey,
        user,
        token,
      },
      channel,
    };
  }

  async captureTranscriptSnapshot(
    adminUserId: string,
    reservationId: string,
    ctx?: RequestContext,
  ) {
    const { playerUserId, ownerUserId } = await this.getReservationParticipants(
      reservationId,
      ctx,
    );

    const memberIds = [playerUserId, ownerUserId];

    const channel = await this.ensureThread(
      reservationId,
      memberIds,
      adminUserId,
      ctx,
    );

    const exportPayload =
      await this.chatProvider.exportReservationChannelMessages({
        reservationId,
        channelId: channel.channelId,
        channelType: channel.channelType,
      });

    const sha256 = createHash("sha256")
      .update(stableStringify(exportPayload))
      .digest("hex");

    const messageDates = exportPayload.messages
      .map((m) => (m.createdAt ? new Date(m.createdAt) : null))
      .filter((d): d is Date => d instanceof Date && !Number.isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());

    const firstMessageAt = messageDates[0] ?? null;
    const lastMessageAt = messageDates[messageDates.length - 1] ?? null;

    return this.reservationChatTranscriptRepository.create(
      {
        reservationId,
        providerId: exportPayload.providerId,
        providerChannelType: exportPayload.channelType,
        providerChannelId: exportPayload.channelId,
        capturedByUserId: adminUserId,
        capturedAt: new Date(),
        messageCount: exportPayload.messages.length,
        firstMessageAt,
        lastMessageAt,
        transcriptSha256: sha256,
        transcriptJson: exportPayload as unknown as Record<string, unknown>,
      },
      ctx,
    );
  }

  async listTranscriptSnapshots(reservationId: string, ctx?: RequestContext) {
    return this.reservationChatTranscriptRepository.listByReservationId(
      reservationId,
      ctx,
    );
  }
}
