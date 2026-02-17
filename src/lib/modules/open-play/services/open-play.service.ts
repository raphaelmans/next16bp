import { eq } from "drizzle-orm";
import { CourtNotFoundError } from "@/lib/modules/court/errors/court.errors";
import { PlaceNotFoundError } from "@/lib/modules/place/errors/place.errors";
import { ReservationNotFoundError } from "@/lib/modules/reservation/errors/reservation.errors";
import {
  court,
  type InsertOpenPlay,
  type OpenPlayParticipantRecord,
  type OpenPlayRecord,
  openPlay,
  openPlayParticipant,
  place,
  profile,
  reservation,
} from "@/lib/shared/infra/db/schema";
import type { DrizzleTransaction } from "@/lib/shared/infra/db/types";
import { logger } from "@/lib/shared/infra/logger";
import type { RequestContext } from "@/lib/shared/kernel/context";
import type { TransactionManager } from "@/lib/shared/kernel/transaction";
import type {
  CancelOpenPlayDTO,
  CloseOpenPlayDTO,
  CreateOpenPlayFromReservationDTO,
  DecideOpenPlayParticipantDTO,
  GetOpenPlayDTO,
  GetOpenPlayForReservationDTO,
  LeaveOpenPlayDTO,
  ListOpenPlaysByPlaceDTO,
  RequestJoinOpenPlayDTO,
} from "../dtos";
import {
  OpenPlayAlreadyParticipatingError,
  OpenPlayCannotJoinOwnError,
  OpenPlayCapacityReachedError,
  OpenPlayNotActiveError,
  OpenPlayNotFoundError,
  OpenPlayNotHostError,
  OpenPlayReservationNotConfirmedError,
  OpenPlayStartsInPastError,
} from "../errors/open-play.errors";
import type {
  IOpenPlayRepository,
  OpenPlayDetailContextRecord,
  OpenPlayListItemRecord,
} from "../repositories/open-play.repository";
import type {
  IOpenPlayParticipantRepository,
  OpenPlayParticipantStatus,
} from "../repositories/open-play-participant.repository";

type OpenPlayVisibility = "PUBLIC" | "UNLISTED";
type OpenPlayJoinPolicy = "REQUEST" | "AUTO";
type OpenPlayStatus = "ACTIVE" | "CLOSED" | "CANCELLED";

export interface OpenPlayCostSharing {
  reservationTotalPriceCents: number;
  currency: string;
  splitBasisPlayers: number;
  suggestedSplitPerPlayerCents: number;
  paymentInstructions: string | null;
  paymentLinkUrl: string | null;
  requiresPayment: boolean;
}

export interface OpenPlayCard {
  id: string;
  startsAtIso: string;
  endsAtIso: string;
  title: string | null;
  note: string | null;
  joinPolicy: OpenPlayJoinPolicy;
  maxPlayers: number;
  confirmedCount: number;
  availableSpots: number;
  courtLabel: string;
  sportName: string;
  costSharing: Pick<
    OpenPlayCostSharing,
    "currency" | "suggestedSplitPerPlayerCents" | "requiresPayment"
  >;
  host: {
    profileId: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

export interface OpenPlayPublicDetail {
  openPlay: {
    id: string;
    status: OpenPlayStatus;
    visibility: OpenPlayVisibility;
    joinPolicy: OpenPlayJoinPolicy;
    maxPlayers: number;
    startsAtIso: string;
    endsAtIso: string;
    title: string | null;
    note: string | null;
    confirmedCount: number;
    availableSpots: number;
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
    avatarUrl: string | null;
  };
  costSharing: OpenPlayCostSharing;
}

export interface OpenPlayViewerDetail extends OpenPlayPublicDetail {
  reservationStatus: string;
  viewer: {
    role: "host" | "participant" | "none";
    myStatus: OpenPlayParticipantStatus | null;
  };
  participants: {
    confirmed: Array<{
      profileId: string;
      displayName: string;
      avatarUrl: string | null;
    }>;
    requested?: Array<{
      participantId: string;
      profileId: string;
      displayName: string;
      avatarUrl: string | null;
      message: string | null;
      status: OpenPlayParticipantStatus;
    }>;
    waitlisted?: Array<{
      participantId: string;
      profileId: string;
      displayName: string;
      avatarUrl: string | null;
      message: string | null;
      status: OpenPlayParticipantStatus;
    }>;
  } | null;
}

export interface IOpenPlayService {
  listPublicByPlace(
    input: ListOpenPlaysByPlaceDTO,
    now: Date,
    ctx?: RequestContext,
  ): Promise<OpenPlayCard[]>;
  getPublicDetail(
    input: GetOpenPlayDTO,
    now: Date,
    ctx?: RequestContext,
  ): Promise<OpenPlayPublicDetail>;
  getViewerDetail(
    userId: string,
    viewerProfileId: string,
    input: GetOpenPlayDTO,
    now: Date,
    ctx?: RequestContext,
  ): Promise<OpenPlayViewerDetail>;
  getForReservation(
    userId: string,
    viewerProfileId: string,
    input: GetOpenPlayForReservationDTO,
    ctx?: RequestContext,
  ): Promise<OpenPlayRecord | null>;
  createFromReservation(
    userId: string,
    hostProfileId: string,
    input: CreateOpenPlayFromReservationDTO,
  ): Promise<OpenPlayRecord>;
  requestToJoin(
    userId: string,
    profileId: string,
    input: RequestJoinOpenPlayDTO,
  ): Promise<{ participant: OpenPlayParticipantRecord }>;
  leave(
    userId: string,
    profileId: string,
    input: LeaveOpenPlayDTO,
  ): Promise<{
    participant: OpenPlayParticipantRecord | null;
    previousStatus: OpenPlayParticipantStatus | null;
  }>;
  decideParticipant(
    userId: string,
    hostProfileId: string,
    input: DecideOpenPlayParticipantDTO,
  ): Promise<{
    participant: OpenPlayParticipantRecord;
    openPlayId: string;
    targetUserId: string;
    previousStatus: OpenPlayParticipantStatus;
  }>;
  close(
    userId: string,
    hostProfileId: string,
    input: CloseOpenPlayDTO,
  ): Promise<OpenPlayRecord>;
  cancel(
    userId: string,
    hostProfileId: string,
    input: CancelOpenPlayDTO,
  ): Promise<OpenPlayRecord>;
}

const toIsoString = (value: Date | string) =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

export class OpenPlayService implements IOpenPlayService {
  constructor(
    private openPlayRepository: IOpenPlayRepository,
    private openPlayParticipantRepository: IOpenPlayParticipantRepository,
    private transactionManager: TransactionManager,
  ) {}

  private toCostSharingFromListItem(
    item: OpenPlayListItemRecord,
  ): OpenPlayCostSharing {
    const reservationTotalPriceCents = Math.max(
      0,
      item.reservationTotalPriceCents,
    );
    const splitBasisPlayers = Math.max(1, item.maxPlayers);
    const suggestedSplitPerPlayerCents =
      reservationTotalPriceCents > 0
        ? Math.ceil(reservationTotalPriceCents / splitBasisPlayers)
        : 0;

    return {
      reservationTotalPriceCents,
      currency: item.currency,
      splitBasisPlayers,
      suggestedSplitPerPlayerCents,
      paymentInstructions: item.paymentInstructions,
      paymentLinkUrl: item.paymentLinkUrl,
      requiresPayment: reservationTotalPriceCents > 0,
    };
  }

  private toCostSharingFromContext(
    context: OpenPlayDetailContextRecord,
  ): OpenPlayCostSharing {
    const reservationTotalPriceCents = Math.max(
      0,
      context.reservationTotalPriceCents,
    );
    const splitBasisPlayers = Math.max(1, context.openPlay.maxPlayers);
    const suggestedSplitPerPlayerCents =
      reservationTotalPriceCents > 0
        ? Math.ceil(reservationTotalPriceCents / splitBasisPlayers)
        : 0;

    return {
      reservationTotalPriceCents,
      currency: context.currency,
      splitBasisPlayers,
      suggestedSplitPerPlayerCents,
      paymentInstructions: context.openPlay.paymentInstructions ?? null,
      paymentLinkUrl: context.openPlay.paymentLinkUrl ?? null,
      requiresPayment: reservationTotalPriceCents > 0,
    };
  }

  async listPublicByPlace(
    input: ListOpenPlaysByPlaceDTO,
    now: Date,
    ctx?: RequestContext,
  ): Promise<OpenPlayCard[]> {
    const from = input.fromIso ? new Date(input.fromIso) : undefined;
    const to = input.toIso ? new Date(input.toIso) : undefined;

    const items = await this.openPlayRepository.listPublicUpcomingByPlace(
      input.placeId,
      now,
      { from, to, limit: input.limit },
      ctx,
    );

    return items.map((item) => {
      const confirmedCount = item.confirmedCount;
      const availableSpots = Math.max(0, item.maxPlayers - confirmedCount);
      const costSharing = this.toCostSharingFromListItem(item);
      return {
        id: item.id,
        startsAtIso: item.startsAtIso,
        endsAtIso: item.endsAtIso,
        title: item.title,
        note: item.note,
        joinPolicy: item.joinPolicy as OpenPlayJoinPolicy,
        maxPlayers: item.maxPlayers,
        confirmedCount,
        availableSpots,
        courtLabel: item.courtLabel,
        sportName: item.sportName,
        costSharing: {
          currency: costSharing.currency,
          suggestedSplitPerPlayerCents:
            costSharing.suggestedSplitPerPlayerCents,
          requiresPayment: costSharing.requiresPayment,
        },
        host: {
          profileId: item.host.profileId,
          displayName: item.host.displayName ?? "Host",
          avatarUrl: item.host.avatarUrl,
        },
      };
    });
  }

  private assertConfirmedAndActive(
    context: OpenPlayDetailContextRecord,
    now: Date,
  ) {
    if (context.reservationStatus !== "CONFIRMED") {
      throw new OpenPlayReservationNotConfirmedError();
    }
    if (context.openPlay.status !== "ACTIVE") {
      throw new OpenPlayNotActiveError(context.openPlay.status);
    }
    if (new Date(context.openPlay.startsAt).getTime() <= now.getTime()) {
      throw new OpenPlayStartsInPastError();
    }
  }

  private toPublicDetail(
    context: OpenPlayDetailContextRecord,
  ): OpenPlayPublicDetail {
    const confirmedCount = context.counts.confirmed;
    const costSharing = this.toCostSharingFromContext(context);
    const availableSpots = Math.max(
      0,
      context.openPlay.maxPlayers - confirmedCount,
    );

    return {
      openPlay: {
        id: context.openPlay.id,
        status: context.openPlay.status as OpenPlayStatus,
        visibility: context.openPlay.visibility as OpenPlayVisibility,
        joinPolicy: context.openPlay.joinPolicy as OpenPlayJoinPolicy,
        maxPlayers: context.openPlay.maxPlayers,
        startsAtIso: toIsoString(context.openPlay.startsAt),
        endsAtIso: toIsoString(context.openPlay.endsAt),
        title: context.openPlay.title ?? null,
        note: context.openPlay.note ?? null,
        confirmedCount,
        availableSpots,
      },
      place: context.place,
      court: context.court,
      sport: context.sport,
      host: {
        profileId: context.host.profileId,
        displayName: context.host.displayName ?? "Host",
        avatarUrl: context.host.avatarUrl,
      },
      costSharing,
    };
  }

  async getPublicDetail(
    input: GetOpenPlayDTO,
    now: Date,
    ctx?: RequestContext,
  ): Promise<OpenPlayPublicDetail> {
    const context = await this.openPlayRepository.getDetailContext(
      input.openPlayId,
      now,
      ctx,
    );
    if (!context) {
      throw new OpenPlayNotFoundError(input.openPlayId);
    }

    // Public detail is only available once the underlying reservation is confirmed.
    if (context.reservationStatus !== "CONFIRMED") {
      throw new OpenPlayNotFoundError(input.openPlayId);
    }

    // Public detail does not guarantee joinability; UI will show state.
    return this.toPublicDetail(context);
  }

  async getViewerDetail(
    _userId: string,
    viewerProfileId: string,
    input: GetOpenPlayDTO,
    now: Date,
    ctx?: RequestContext,
  ): Promise<OpenPlayViewerDetail> {
    const context = await this.openPlayRepository.getDetailContext(
      input.openPlayId,
      now,
      ctx,
    );
    if (!context) {
      throw new OpenPlayNotFoundError(input.openPlayId);
    }

    const isHost = context.host.profileId === viewerProfileId;
    if (context.reservationStatus !== "CONFIRMED" && !isHost) {
      // Don't leak Open Play details before reservation confirmation.
      throw new OpenPlayNotFoundError(input.openPlayId);
    }

    const myParticipant =
      await this.openPlayParticipantRepository.findByOpenPlayIdAndProfileId(
        context.openPlay.id,
        viewerProfileId,
        ctx,
      );

    const viewerRole: "host" | "participant" | "none" = isHost
      ? "host"
      : myParticipant
        ? "participant"
        : "none";

    const base = this.toPublicDetail(context);

    const confirmed =
      await this.openPlayParticipantRepository.listWithProfilesByOpenPlayId(
        context.openPlay.id,
        ["CONFIRMED"],
        ctx,
      );

    if (!isHost) {
      return {
        ...base,
        reservationStatus: context.reservationStatus,
        viewer: {
          role: viewerRole,
          myStatus:
            (myParticipant?.status as OpenPlayParticipantStatus) ?? null,
        },
        participants: {
          confirmed: confirmed
            .filter((p) => p.participant.role !== "HOST")
            .map((p) => ({
              profileId: p.profile.id,
              displayName: p.profile.displayName ?? "Player",
              avatarUrl: p.profile.avatarUrl ?? null,
            })),
        },
      };
    }

    const requestedAndWaitlisted =
      await this.openPlayParticipantRepository.listWithProfilesByOpenPlayId(
        context.openPlay.id,
        ["REQUESTED", "WAITLISTED"],
        ctx,
      );

    const requested = requestedAndWaitlisted
      .filter((p) => p.participant.status === "REQUESTED")
      .map((p) => ({
        participantId: p.participant.id,
        profileId: p.profile.id,
        displayName: p.profile.displayName ?? "Player",
        avatarUrl: p.profile.avatarUrl ?? null,
        message: p.participant.message ?? null,
        status: p.participant.status as OpenPlayParticipantStatus,
      }));

    const waitlisted = requestedAndWaitlisted
      .filter((p) => p.participant.status === "WAITLISTED")
      .map((p) => ({
        participantId: p.participant.id,
        profileId: p.profile.id,
        displayName: p.profile.displayName ?? "Player",
        avatarUrl: p.profile.avatarUrl ?? null,
        message: p.participant.message ?? null,
        status: p.participant.status as OpenPlayParticipantStatus,
      }));

    return {
      ...base,
      reservationStatus: context.reservationStatus,
      viewer: {
        role: viewerRole,
        myStatus: (myParticipant?.status as OpenPlayParticipantStatus) ?? null,
      },
      participants: {
        confirmed: confirmed
          .filter((p) => p.participant.role !== "HOST")
          .map((p) => ({
            profileId: p.profile.id,
            displayName: p.profile.displayName ?? "Player",
            avatarUrl: p.profile.avatarUrl ?? null,
          })),
        requested,
        waitlisted,
      },
    };
  }

  async getForReservation(
    _userId: string,
    viewerProfileId: string,
    input: GetOpenPlayForReservationDTO,
    ctx?: RequestContext,
  ): Promise<OpenPlayRecord | null> {
    const existing = await this.openPlayRepository.findByReservationId(
      input.reservationId,
      ctx,
    );
    if (!existing) {
      return null;
    }
    if (existing.hostProfileId !== viewerProfileId) {
      return null;
    }
    return existing;
  }

  async createFromReservation(
    userId: string,
    hostProfileId: string,
    input: CreateOpenPlayFromReservationDTO,
  ): Promise<OpenPlayRecord> {
    const now = new Date();

    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      const client = tx as DrizzleTransaction;

      const res = await client
        .select({
          id: reservation.id,
          status: reservation.status,
          startTime: reservation.startTime,
          endTime: reservation.endTime,
          totalPriceCents: reservation.totalPriceCents,
          playerId: reservation.playerId,
          courtId: reservation.courtId,
        })
        .from(reservation)
        .where(eq(reservation.id, input.reservationId))
        .limit(1);

      const reservationRow = res[0];
      if (!reservationRow) {
        throw new ReservationNotFoundError(input.reservationId);
      }

      if (reservationRow.playerId !== hostProfileId) {
        throw new OpenPlayNotHostError();
      }

      if (
        reservationRow.status === "CANCELLED" ||
        reservationRow.status === "EXPIRED"
      ) {
        throw new OpenPlayNotActiveError(reservationRow.status);
      }

      if (reservationRow.startTime.getTime() <= now.getTime()) {
        throw new OpenPlayStartsInPastError();
      }

      const courtRow = await client
        .select({
          id: court.id,
          placeId: court.placeId,
          sportId: court.sportId,
        })
        .from(court)
        .where(eq(court.id, reservationRow.courtId))
        .limit(1);

      const courtResult = courtRow[0];
      if (!courtResult) {
        throw new CourtNotFoundError(reservationRow.courtId);
      }
      if (!courtResult.placeId) {
        throw new PlaceNotFoundError();
      }

      const placeRow = await client
        .select({ id: place.id })
        .from(place)
        .where(eq(place.id, courtResult.placeId))
        .limit(1);
      if (!placeRow[0]) {
        throw new PlaceNotFoundError(courtResult.placeId);
      }

      const payload: InsertOpenPlay = {
        reservationId: reservationRow.id,
        hostProfileId,
        placeId: courtResult.placeId,
        courtId: courtResult.id,
        sportId: courtResult.sportId,
        startsAt: reservationRow.startTime,
        endsAt: reservationRow.endTime,
        status: "ACTIVE",
        visibility: input.visibility,
        joinPolicy:
          reservationRow.totalPriceCents > 0 ? "REQUEST" : input.joinPolicy,
        maxPlayers: input.maxPlayers,
        title: input.title,
        note: input.note,
        paymentInstructions: input.paymentInstructions,
        paymentLinkUrl: input.paymentLinkUrl,
      };

      const created = await this.openPlayRepository.upsertByReservationId(
        payload,
        ctx,
      );

      const existingHost =
        await this.openPlayParticipantRepository.findByOpenPlayIdAndProfileId(
          created.id,
          hostProfileId,
          ctx,
        );

      if (!existingHost) {
        await this.openPlayParticipantRepository.create(
          {
            openPlayId: created.id,
            profileId: hostProfileId,
            role: "HOST",
            status: "CONFIRMED",
            message: null,
            decidedAt: new Date(),
            decidedByProfileId: hostProfileId,
          },
          ctx,
        );
      }

      logger.info(
        {
          event: "open_play.created",
          openPlayId: created.id,
          reservationId: input.reservationId,
          userId,
          hostProfileId,
        },
        "Open Play created",
      );

      return created;
    });
  }

  async requestToJoin(
    userId: string,
    profileId: string,
    input: RequestJoinOpenPlayDTO,
  ): Promise<{ participant: OpenPlayParticipantRecord }> {
    const now = new Date();

    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      const context = await this.openPlayRepository.getDetailContext(
        input.openPlayId,
        now,
        ctx,
      );
      if (!context) {
        throw new OpenPlayNotFoundError(input.openPlayId);
      }

      this.assertConfirmedAndActive(context, now);

      if (context.host.profileId === profileId) {
        throw new OpenPlayCannotJoinOwnError();
      }

      const existing =
        await this.openPlayParticipantRepository.findByOpenPlayIdAndProfileId(
          context.openPlay.id,
          profileId,
          ctx,
        );

      if (existing && existing.status !== "LEFT") {
        throw new OpenPlayAlreadyParticipatingError(existing.status);
      }

      const confirmedCount = context.counts.confirmed;
      const capacityAvailable = confirmedCount < context.openPlay.maxPlayers;

      const joinPolicy = context.openPlay.joinPolicy as OpenPlayJoinPolicy;
      const nextStatus: OpenPlayParticipantStatus =
        joinPolicy === "AUTO" && capacityAvailable
          ? "CONFIRMED"
          : capacityAvailable
            ? "REQUESTED"
            : "WAITLISTED";

      const decidedAt = nextStatus === "CONFIRMED" ? new Date() : null;
      const decidedByProfileId =
        nextStatus === "CONFIRMED" ? context.host.profileId : null;

      if (existing) {
        const updated = await this.openPlayParticipantRepository.update(
          existing.id,
          {
            status: nextStatus,
            role: "PLAYER",
            message: input.message,
            decidedAt,
            decidedByProfileId,
          },
          ctx,
        );

        logger.info(
          {
            event: "open_play.join_re_requested",
            openPlayId: context.openPlay.id,
            userId,
            profileId,
            status: nextStatus,
          },
          "Open Play join re-requested",
        );

        return { participant: updated };
      }

      if (nextStatus === "CONFIRMED" && !capacityAvailable) {
        throw new OpenPlayCapacityReachedError(context.openPlay.maxPlayers);
      }

      const created = await this.openPlayParticipantRepository.create(
        {
          openPlayId: context.openPlay.id,
          profileId,
          role: "PLAYER",
          status: nextStatus,
          message: input.message,
          decidedAt,
          decidedByProfileId,
        },
        ctx,
      );

      logger.info(
        {
          event:
            nextStatus === "CONFIRMED"
              ? "open_play.join_auto_confirmed"
              : "open_play.join_requested",
          openPlayId: context.openPlay.id,
          userId,
          profileId,
          status: nextStatus,
        },
        "Open Play join requested",
      );

      return { participant: created };
    });
  }

  async leave(
    userId: string,
    profileId: string,
    input: LeaveOpenPlayDTO,
  ): Promise<{
    participant: OpenPlayParticipantRecord | null;
    previousStatus: OpenPlayParticipantStatus | null;
  }> {
    const now = new Date();

    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      const context = await this.openPlayRepository.getDetailContext(
        input.openPlayId,
        now,
        ctx,
      );
      if (!context) {
        throw new OpenPlayNotFoundError(input.openPlayId);
      }

      if (context.host.profileId === profileId) {
        throw new OpenPlayNotHostError();
      }

      const existing =
        await this.openPlayParticipantRepository.findByOpenPlayIdAndProfileId(
          context.openPlay.id,
          profileId,
          ctx,
        );

      if (!existing) {
        return { participant: null, previousStatus: null };
      }

      const previousStatus = existing.status as OpenPlayParticipantStatus;

      const updated = await this.openPlayParticipantRepository.update(
        existing.id,
        {
          status: "LEFT",
          decidedAt: new Date(),
        },
        ctx,
      );

      logger.info(
        {
          event: "open_play.left",
          openPlayId: context.openPlay.id,
          userId,
          profileId,
        },
        "Open Play left",
      );

      return { participant: updated, previousStatus };
    });
  }

  async decideParticipant(
    userId: string,
    hostProfileId: string,
    input: DecideOpenPlayParticipantDTO,
  ): Promise<{
    participant: OpenPlayParticipantRecord;
    openPlayId: string;
    targetUserId: string;
    previousStatus: OpenPlayParticipantStatus;
  }> {
    const now = new Date();

    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      const client = tx as DrizzleTransaction;

      const rows = await client
        .select({
          participant: openPlayParticipant,
          openPlay,
          targetUserId: profile.userId,
        })
        .from(openPlayParticipant)
        .innerJoin(openPlay, eq(openPlayParticipant.openPlayId, openPlay.id))
        .innerJoin(profile, eq(openPlayParticipant.profileId, profile.id))
        .where(eq(openPlayParticipant.id, input.participantId))
        .limit(1)
        .for("update");

      const row = rows[0];
      if (!row) {
        throw new OpenPlayNotFoundError("participant");
      }

      if (row.openPlay.hostProfileId !== hostProfileId) {
        throw new OpenPlayNotHostError();
      }

      const context = await this.openPlayRepository.getDetailContext(
        row.openPlay.id,
        now,
        ctx,
      );
      if (!context) {
        throw new OpenPlayNotFoundError(row.openPlay.id);
      }

      this.assertConfirmedAndActive(context, now);

      if (row.participant.role === "HOST") {
        throw new OpenPlayNotHostError();
      }

      const previousStatus = row.participant
        .status as OpenPlayParticipantStatus;

      if (input.decision === "CONFIRM") {
        const confirmedCount = context.counts.confirmed;
        if (confirmedCount >= context.openPlay.maxPlayers) {
          throw new OpenPlayCapacityReachedError(context.openPlay.maxPlayers);
        }
      }

      const nextStatus: OpenPlayParticipantStatus =
        input.decision === "CONFIRM"
          ? "CONFIRMED"
          : input.decision === "WAITLIST"
            ? "WAITLISTED"
            : "DECLINED";

      const updated = await this.openPlayParticipantRepository.update(
        row.participant.id,
        {
          status: nextStatus,
          decidedAt: new Date(),
          decidedByProfileId: hostProfileId,
        },
        ctx,
      );

      logger.info(
        {
          event: `open_play.participant_${nextStatus.toLowerCase()}`,
          openPlayId: row.openPlay.id,
          participantId: row.participant.id,
          hostProfileId,
          userId,
        },
        "Open Play participant decision",
      );

      return {
        participant: updated,
        openPlayId: row.openPlay.id,
        targetUserId: row.targetUserId,
        previousStatus,
      };
    });
  }

  async close(
    userId: string,
    hostProfileId: string,
    input: CloseOpenPlayDTO,
  ): Promise<OpenPlayRecord> {
    const now = new Date();

    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      const client = tx as DrizzleTransaction;
      const existing = await this.openPlayRepository.findById(
        input.openPlayId,
        ctx,
      );
      if (!existing) {
        throw new OpenPlayNotFoundError(input.openPlayId);
      }

      if (existing.hostProfileId !== hostProfileId) {
        throw new OpenPlayNotHostError();
      }

      if (new Date(existing.startsAt).getTime() <= now.getTime()) {
        throw new OpenPlayStartsInPastError();
      }

      const [updated] = await client
        .update(openPlay)
        .set({ status: "CLOSED", updatedAt: new Date() })
        .where(eq(openPlay.id, existing.id))
        .returning();

      logger.info(
        {
          event: "open_play.closed",
          openPlayId: existing.id,
          userId,
          hostProfileId,
        },
        "Open Play closed",
      );

      return updated;
    });
  }

  async cancel(
    userId: string,
    hostProfileId: string,
    input: CancelOpenPlayDTO,
  ): Promise<OpenPlayRecord> {
    const now = new Date();

    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      const client = tx as DrizzleTransaction;

      const existing = await this.openPlayRepository.findById(
        input.openPlayId,
        ctx,
      );
      if (!existing) {
        throw new OpenPlayNotFoundError(input.openPlayId);
      }

      if (existing.hostProfileId !== hostProfileId) {
        throw new OpenPlayNotHostError();
      }

      if (new Date(existing.startsAt).getTime() <= now.getTime()) {
        throw new OpenPlayStartsInPastError();
      }

      const [updated] = await client
        .update(openPlay)
        .set({ status: "CANCELLED", updatedAt: new Date() })
        .where(eq(openPlay.id, existing.id))
        .returning();

      logger.info(
        {
          event: "open_play.cancelled",
          openPlayId: existing.id,
          userId,
          hostProfileId,
        },
        "Open Play cancelled",
      );

      return updated;
    });
  }
}
