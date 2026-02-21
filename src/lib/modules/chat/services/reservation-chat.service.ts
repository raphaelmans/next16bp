import { createHash } from "node:crypto";
import { and, eq, inArray, or } from "drizzle-orm";
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
import { getContainer } from "@/lib/shared/infra/container";
import {
  chatInboxArchive,
  court,
  organization,
  place,
  profile,
  reservation,
} from "@/lib/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/lib/shared/infra/db/types";
import type { RequestContext } from "@/lib/shared/kernel/context";
import {
  ReservationChatGuestReservationNotSupportedError,
  ReservationChatNotAvailableError,
  ReservationChatNotParticipantError,
} from "../errors/reservation-chat.errors";
import { makeReservationChannelId } from "../helpers/reservation-channel-id";
import type {
  ChatMessageAttachmentInput,
  IChatProvider,
} from "../providers/chat.provider";
import type { IReservationChatThreadRepository } from "../repositories/reservation-chat-thread.repository";
import type { IReservationChatTranscriptRepository } from "../repositories/reservation-chat-transcript.repository";
import type {
  ChatAuthResult,
  ReservationChatChannelResult,
  ReservationChatMeta,
} from "../types";

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

  private async getReservationContext(
    reservationId: string,
    ctx?: RequestContext,
  ): Promise<{
    reservation: {
      id: string;
      status: string;
      startTime: Date;
      endTime: Date;
      playerId: string;
      courtId: string;
    };
    profile: {
      id: string;
      userId: string;
      displayName: string | null;
    };
    court: {
      id: string;
      label: string;
      placeId: string;
    };
    place: {
      id: string;
      name: string;
      timeZone: string;
      organizationId: string;
    };
    organization: {
      id: string;
      name: string;
      ownerUserId: string;
    };
  }> {
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
      reservation: {
        id: reservation.id,
        status: reservation.status,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        playerId: reservation.playerId,
        courtId: reservation.courtId,
      },
      profile: {
        id: profile.id,
        userId: profile.userId,
        displayName: profile.displayName,
      },
      court: {
        id: court.id,
        label: court.label,
        placeId: court.placeId,
      },
      place: {
        id: place.id,
        name: place.name,
        timeZone: place.timeZone,
        organizationId: place.organizationId,
      },
      organization: {
        id: organization.id,
        name: organization.name,
        ownerUserId: organization.ownerUserId,
      },
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
  ): Promise<{
    auth: ChatAuthResult;
    channel: ReservationChatChannelResult;
    meta: ReservationChatMeta;
  }> {
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

    const context = await this.getReservationContext(reservationId, ctx);
    const memberIds = [
      context.profile.userId,
      context.organization.ownerUserId,
    ];
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
      meta: {
        reservation: {
          id: context.reservation.id,
          status: context.reservation.status,
          startTimeIso: context.reservation.startTime.toISOString(),
          endTimeIso: context.reservation.endTime.toISOString(),
        },
        place: {
          id: context.place.id,
          name: context.place.name,
          timeZone: context.place.timeZone,
        },
        court: {
          id: context.court.id,
          label: context.court.label,
        },
        participants: {
          player: {
            userId: context.profile.userId,
            displayName: context.profile.displayName ?? "Player",
          },
          owner: {
            userId: context.organization.ownerUserId,
            displayName: context.organization.name,
          },
        },
      },
    };
  }

  async sendMessage(
    userId: string,
    reservationId: string,
    message: {
      text?: string;
      attachments?: ChatMessageAttachmentInput[];
      messageId?: string;
    },
    ctx?: RequestContext,
  ): Promise<void> {
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

    const context = await this.getReservationContext(reservationId, ctx);
    const memberIds = [
      context.profile.userId,
      context.organization.ownerUserId,
    ];
    if (!memberIds.includes(userId)) {
      throw new ReservationChatNotParticipantError(reservationId);
    }

    const channel = await this.ensureThread(
      reservationId,
      memberIds,
      userId,
      ctx,
    );

    await this.chatProvider.sendMessage({
      channelType: channel.channelType,
      channelId: channel.channelId,
      createdById: userId,
      text: message.text,
      attachments: message.attachments,
      messageId: message.messageId,
    });
  }

  async captureTranscriptSnapshot(
    adminUserId: string,
    reservationId: string,
    ctx?: RequestContext,
  ) {
    const context = await this.getReservationContext(reservationId, ctx);
    const memberIds = [
      context.profile.userId,
      context.organization.ownerUserId,
    ];

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

  async getThreadMetas(
    userId: string,
    reservationIds: string[],
    options?: {
      includeArchived?: boolean;
    },
    ctx?: RequestContext,
  ): Promise<
    Array<{
      reservationId: string;
      status: string;
      placeName: string;
      timeZone: string;
      courtLabel: string;
      playerDisplayName: string;
      ownerDisplayName: string;
      updatedAtIso: string;
      startTimeIso: string;
      endTimeIso: string;
    }>
  > {
    if (reservationIds.length === 0) {
      return [];
    }

    const client: DbClient | DrizzleTransaction =
      (ctx?.tx as DrizzleTransaction) ?? getContainer().db;

    const rows = await client
      .select({
        reservationId: reservation.id,
        status: reservation.status,
        updatedAt: reservation.updatedAt,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        courtLabel: court.label,
        placeName: place.name,
        timeZone: place.timeZone,
        playerUserId: profile.userId,
        playerDisplayName: profile.displayName,
        ownerUserId: organization.ownerUserId,
        ownerDisplayName: organization.name,
      })
      .from(reservation)
      .innerJoin(court, eq(reservation.courtId, court.id))
      .innerJoin(place, eq(court.placeId, place.id))
      .innerJoin(organization, eq(place.organizationId, organization.id))
      .innerJoin(profile, eq(reservation.playerId, profile.id))
      .where(
        and(
          inArray(reservation.id, reservationIds),
          // Authorization: return if caller is participant (player or owner)
          or(eq(profile.userId, userId), eq(organization.ownerUserId, userId)),
        ),
      );

    const shouldIncludeArchived = options?.includeArchived === true;

    const archivedThreadIds = new Set<string>();
    if (!shouldIncludeArchived) {
      const threadIds = rows.map((row) => `res-${row.reservationId}`);
      if (threadIds.length > 0) {
        const archivedRows = await client
          .select({ threadId: chatInboxArchive.threadId })
          .from(chatInboxArchive)
          .where(
            and(
              eq(chatInboxArchive.userId, userId),
              eq(chatInboxArchive.threadKind, "reservation"),
              inArray(chatInboxArchive.threadId, threadIds),
            ),
          );

        for (const archivedRow of archivedRows) {
          archivedThreadIds.add(archivedRow.threadId);
        }
      }
    }

    return rows
      .filter((row) => {
        if (shouldIncludeArchived) {
          return true;
        }

        if (archivedThreadIds.has(`res-${row.reservationId}`)) {
          return false;
        }

        if (
          row.status === "CREATED" ||
          row.status === "AWAITING_PAYMENT" ||
          row.status === "PAYMENT_MARKED_BY_USER"
        ) {
          return true;
        }

        if (row.status === "CONFIRMED") {
          const endTime =
            row.endTime instanceof Date
              ? row.endTime
              : new Date(String(row.endTime));
          return endTime.getTime() >= Date.now();
        }

        return false;
      })
      .map((r: (typeof rows)[number]) => ({
        reservationId: r.reservationId,
        status: r.status,
        placeName: r.placeName,
        timeZone: r.timeZone,
        courtLabel: r.courtLabel,
        playerDisplayName: r.playerDisplayName ?? "Player",
        ownerDisplayName: r.ownerDisplayName,
        updatedAtIso:
          r.updatedAt instanceof Date
            ? r.updatedAt.toISOString()
            : String(r.updatedAt),
        startTimeIso:
          r.startTime instanceof Date
            ? r.startTime.toISOString()
            : String(r.startTime),
        endTimeIso:
          r.endTime instanceof Date
            ? r.endTime.toISOString()
            : String(r.endTime),
      }));
  }
}
