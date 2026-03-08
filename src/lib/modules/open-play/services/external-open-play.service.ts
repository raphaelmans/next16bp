import { asc, eq } from "drizzle-orm";
import { CourtNotFoundError } from "@/lib/modules/court/errors/court.errors";
import { ReservationNotFoundError } from "@/lib/modules/reservation/errors/reservation.errors";
import {
  court,
  type ExternalOpenPlayParticipantRecord,
  type ExternalOpenPlayRecord,
  reservation,
  reservationGroup,
} from "@/lib/shared/infra/db/schema";
import type { DrizzleTransaction } from "@/lib/shared/infra/db/types";
import { logger } from "@/lib/shared/infra/logger";
import type { RequestContext } from "@/lib/shared/kernel/context";
import { ValidationError } from "@/lib/shared/kernel/errors";
import type { TransactionManager } from "@/lib/shared/kernel/transaction";
import type {
  CancelExternalOpenPlayDTO,
  CloseExternalOpenPlayDTO,
  CreateExternalOpenPlayDTO,
  DecideExternalOpenPlayParticipantDTO,
  GetExternalOpenPlayDTO,
  LeaveExternalOpenPlayDTO,
  ListExternalOpenPlaysByPlaceDTO,
  PromoteExternalOpenPlayDTO,
  ReportExternalOpenPlayDTO,
  RequestJoinExternalOpenPlayDTO,
} from "../dtos";
import {
  ExternalOpenPlayAlreadyParticipatingError,
  ExternalOpenPlayCannotJoinOwnError,
  ExternalOpenPlayCapacityReachedError,
  ExternalOpenPlayNotActiveError,
  ExternalOpenPlayNotFoundError,
  ExternalOpenPlayNotHostError,
  ExternalOpenPlayPromotionMismatchError,
  ExternalOpenPlayStartsInPastError,
} from "../errors/open-play.errors";
import type {
  ExternalOpenPlayDetailContextRecord,
  ExternalOpenPlayListItemRecord,
  IExternalOpenPlayRepository,
} from "../repositories/external-open-play.repository";
import type {
  ExternalOpenPlayParticipantStatus,
  IExternalOpenPlayParticipantRepository,
} from "../repositories/external-open-play-participant.repository";
import type { IExternalOpenPlayReportRepository } from "../repositories/external-open-play-report.repository";
import type { IOpenPlayParticipantRepository } from "../repositories/open-play-participant.repository";
import type { IOpenPlayService } from "./open-play.service";

type ExternalOpenPlayVisibility = "PUBLIC" | "UNLISTED";
type ExternalOpenPlayJoinPolicy = "REQUEST" | "AUTO";
type ExternalOpenPlayStatus =
  | "ACTIVE"
  | "CLOSED"
  | "CANCELLED"
  | "PROMOTED"
  | "HIDDEN";

const REPORT_HIDE_THRESHOLD = 3;
const COURT_SUMMARY_MAX_LENGTH = 120;

const toIsoString = (value: Date | string) =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

const toStoredCourtSummaryLabel = (
  courts: Array<{
    label: string;
  }>,
) => {
  const firstLabel = courts[0]?.label ?? "Court";
  const summary =
    courts.length <= 1
      ? firstLabel
      : `${firstLabel} +${courts.length - 1} more`;
  return summary.slice(0, COURT_SUMMARY_MAX_LENGTH);
};

export interface ExternalOpenPlayCard {
  id: string;
  startsAtIso: string;
  endsAtIso: string;
  title: string | null;
  note: string | null;
  courtSummaryLabel: string | null;
  courts: Array<{
    label: string;
  }>;
  joinPolicy: ExternalOpenPlayJoinPolicy;
  maxPlayers: number;
  confirmedCount: number;
  availableSpots: number;
  sportName: string;
  sourcePlatform: "RECLUB" | "OTHER";
  reportCount: number;
  host: {
    profileId: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

export interface ExternalOpenPlayPublicDetail {
  externalOpenPlay: {
    id: string;
    status: ExternalOpenPlayStatus;
    visibility: ExternalOpenPlayVisibility;
    joinPolicy: ExternalOpenPlayJoinPolicy;
    maxPlayers: number;
    startsAtIso: string;
    endsAtIso: string;
    title: string | null;
    note: string | null;
    courtSummaryLabel: string | null;
    sourcePlatform: "RECLUB" | "OTHER";
    reportCount: number;
    confirmedCount: number;
    availableSpots: number;
    promotedOpenPlayId: string | null;
  };
  courts: Array<{
    label: string;
  }>;
  place: {
    id: string;
    name: string;
    timeZone: string;
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
}

export interface ExternalOpenPlayViewerDetail
  extends ExternalOpenPlayPublicDetail {
  viewer: {
    role: "host" | "participant" | "none";
    myStatus: ExternalOpenPlayParticipantStatus | null;
  };
  participants: {
    confirmed: {
      profileId: string;
      displayName: string;
      avatarUrl: string | null;
    }[];
    requested?: {
      participantId: string;
      profileId: string;
      displayName: string;
      avatarUrl: string | null;
      message: string | null;
      status: ExternalOpenPlayParticipantStatus;
    }[];
    waitlisted?: {
      participantId: string;
      profileId: string;
      displayName: string;
      avatarUrl: string | null;
      message: string | null;
      status: ExternalOpenPlayParticipantStatus;
    }[];
  };
}

export interface IExternalOpenPlayService {
  listPublicByPlace(
    input: ListExternalOpenPlaysByPlaceDTO,
    now: Date,
    ctx?: RequestContext,
  ): Promise<ExternalOpenPlayCard[]>;
  getPublicDetail(
    input: GetExternalOpenPlayDTO,
    now: Date,
    ctx?: RequestContext,
  ): Promise<ExternalOpenPlayPublicDetail>;
  getViewerDetail(
    userId: string,
    viewerProfileId: string,
    input: GetExternalOpenPlayDTO,
    now: Date,
    ctx?: RequestContext,
  ): Promise<ExternalOpenPlayViewerDetail>;
  create(
    userId: string,
    hostProfileId: string,
    input: CreateExternalOpenPlayDTO,
  ): Promise<ExternalOpenPlayRecord>;
  requestToJoin(
    userId: string,
    profileId: string,
    input: RequestJoinExternalOpenPlayDTO,
  ): Promise<{ participant: ExternalOpenPlayParticipantRecord }>;
  leave(
    userId: string,
    profileId: string,
    input: LeaveExternalOpenPlayDTO,
  ): Promise<{
    participant: ExternalOpenPlayParticipantRecord | null;
    previousStatus: ExternalOpenPlayParticipantStatus | null;
  }>;
  decideParticipant(
    userId: string,
    hostProfileId: string,
    input: DecideExternalOpenPlayParticipantDTO,
  ): Promise<{
    participant: ExternalOpenPlayParticipantRecord;
    previousStatus: ExternalOpenPlayParticipantStatus;
    externalOpenPlayId: string;
  }>;
  close(
    userId: string,
    hostProfileId: string,
    input: CloseExternalOpenPlayDTO,
  ): Promise<ExternalOpenPlayRecord>;
  cancel(
    userId: string,
    hostProfileId: string,
    input: CancelExternalOpenPlayDTO,
  ): Promise<ExternalOpenPlayRecord>;
  report(
    userId: string,
    reporterProfileId: string,
    input: ReportExternalOpenPlayDTO,
  ): Promise<{ reported: boolean; reportCount: number; hidden: boolean }>;
  promoteToVerified(
    userId: string,
    hostProfileId: string,
    input: PromoteExternalOpenPlayDTO,
  ): Promise<{ openPlayId: string }>;
}

export class ExternalOpenPlayService implements IExternalOpenPlayService {
  constructor(
    private externalOpenPlayRepository: IExternalOpenPlayRepository,
    private externalOpenPlayParticipantRepository: IExternalOpenPlayParticipantRepository,
    private externalOpenPlayReportRepository: IExternalOpenPlayReportRepository,
    private verifiedOpenPlayService: IOpenPlayService,
    private verifiedOpenPlayParticipantRepository: IOpenPlayParticipantRepository,
    private transactionManager: TransactionManager,
  ) {}

  private assertActiveAndFuture(
    context: ExternalOpenPlayDetailContextRecord,
    now: Date,
  ) {
    if (context.externalOpenPlay.status !== "ACTIVE") {
      throw new ExternalOpenPlayNotActiveError(context.externalOpenPlay.status);
    }
    if (
      new Date(context.externalOpenPlay.startsAt).getTime() <= now.getTime()
    ) {
      throw new ExternalOpenPlayStartsInPastError();
    }
  }

  private toPublicDetail(
    context: ExternalOpenPlayDetailContextRecord,
  ): ExternalOpenPlayPublicDetail {
    const confirmedCount = context.counts.confirmed;
    const availableSpots = Math.max(
      0,
      context.externalOpenPlay.maxPlayers - confirmedCount,
    );

    return {
      externalOpenPlay: {
        id: context.externalOpenPlay.id,
        status: context.externalOpenPlay.status as ExternalOpenPlayStatus,
        visibility: context.externalOpenPlay
          .visibility as ExternalOpenPlayVisibility,
        joinPolicy: context.externalOpenPlay
          .joinPolicy as ExternalOpenPlayJoinPolicy,
        maxPlayers: context.externalOpenPlay.maxPlayers,
        startsAtIso: toIsoString(context.externalOpenPlay.startsAt),
        endsAtIso: toIsoString(context.externalOpenPlay.endsAt),
        title: context.externalOpenPlay.title ?? null,
        note: context.externalOpenPlay.note ?? null,
        courtSummaryLabel:
          context.courts.length > 0
            ? context.courts.map((court) => court.label).join(", ")
            : (context.externalOpenPlay.courtLabel ?? null),
        sourcePlatform: context.externalOpenPlay.sourcePlatform as
          | "RECLUB"
          | "OTHER",
        reportCount: context.externalOpenPlay.reportCount,
        confirmedCount,
        availableSpots,
        promotedOpenPlayId: context.externalOpenPlay.promotedOpenPlayId ?? null,
      },
      courts: context.courts,
      place: context.place,
      sport: context.sport,
      host: {
        profileId: context.host.profileId,
        displayName: context.host.displayName ?? "Host",
        avatarUrl: context.host.avatarUrl,
      },
    };
  }

  async listPublicByPlace(
    input: ListExternalOpenPlaysByPlaceDTO,
    now: Date,
    ctx?: RequestContext,
  ): Promise<ExternalOpenPlayCard[]> {
    const from = input.fromIso ? new Date(input.fromIso) : undefined;
    const to = input.toIso ? new Date(input.toIso) : undefined;

    const items =
      await this.externalOpenPlayRepository.listPublicUpcomingByPlace(
        input.placeId,
        now,
        { from, to, limit: input.limit },
        ctx,
      );

    return items.map((item: ExternalOpenPlayListItemRecord) => {
      const availableSpots = Math.max(0, item.maxPlayers - item.confirmedCount);
      return {
        id: item.id,
        startsAtIso: item.startsAtIso,
        endsAtIso: item.endsAtIso,
        title: item.title,
        note: item.note,
        courtSummaryLabel: item.courtSummaryLabel,
        courts: item.courts,
        joinPolicy: item.joinPolicy as ExternalOpenPlayJoinPolicy,
        maxPlayers: item.maxPlayers,
        confirmedCount: item.confirmedCount,
        availableSpots,
        sportName: item.sportName,
        sourcePlatform: item.sourcePlatform as "RECLUB" | "OTHER",
        reportCount: item.reportCount,
        host: {
          profileId: item.host.profileId,
          displayName: item.host.displayName ?? "Host",
          avatarUrl: item.host.avatarUrl,
        },
      };
    });
  }

  async getPublicDetail(
    input: GetExternalOpenPlayDTO,
    now: Date,
    ctx?: RequestContext,
  ): Promise<ExternalOpenPlayPublicDetail> {
    const context = await this.externalOpenPlayRepository.getDetailContext(
      input.externalOpenPlayId,
      now,
      ctx,
    );
    if (!context) {
      throw new ExternalOpenPlayNotFoundError(input.externalOpenPlayId);
    }
    if (context.externalOpenPlay.status === "HIDDEN") {
      throw new ExternalOpenPlayNotFoundError(input.externalOpenPlayId);
    }

    return this.toPublicDetail(context);
  }

  async getViewerDetail(
    _userId: string,
    viewerProfileId: string,
    input: GetExternalOpenPlayDTO,
    now: Date,
    ctx?: RequestContext,
  ): Promise<ExternalOpenPlayViewerDetail> {
    const context = await this.externalOpenPlayRepository.getDetailContext(
      input.externalOpenPlayId,
      now,
      ctx,
    );
    if (!context) {
      throw new ExternalOpenPlayNotFoundError(input.externalOpenPlayId);
    }

    const isHost = context.host.profileId === viewerProfileId;
    const myParticipant =
      await this.externalOpenPlayParticipantRepository.findByOpenPlayIdAndProfileId(
        context.externalOpenPlay.id,
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
      await this.externalOpenPlayParticipantRepository.listWithProfilesByOpenPlayId(
        context.externalOpenPlay.id,
        ["CONFIRMED"],
        ctx,
      );

    if (!isHost) {
      return {
        ...base,
        viewer: {
          role: viewerRole,
          myStatus:
            (myParticipant?.status as ExternalOpenPlayParticipantStatus) ??
            null,
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
      await this.externalOpenPlayParticipantRepository.listWithProfilesByOpenPlayId(
        context.externalOpenPlay.id,
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
        status: p.participant.status as ExternalOpenPlayParticipantStatus,
      }));

    const waitlisted = requestedAndWaitlisted
      .filter((p) => p.participant.status === "WAITLISTED")
      .map((p) => ({
        participantId: p.participant.id,
        profileId: p.profile.id,
        displayName: p.profile.displayName ?? "Player",
        avatarUrl: p.profile.avatarUrl ?? null,
        message: p.participant.message ?? null,
        status: p.participant.status as ExternalOpenPlayParticipantStatus,
      }));

    return {
      ...base,
      viewer: {
        role: viewerRole,
        myStatus:
          (myParticipant?.status as ExternalOpenPlayParticipantStatus) ?? null,
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

  async create(
    userId: string,
    hostProfileId: string,
    input: CreateExternalOpenPlayDTO,
  ): Promise<ExternalOpenPlayRecord> {
    const now = new Date();
    const startsAt = new Date(input.startsAtIso);
    const endsAt = new Date(input.endsAtIso);

    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      throw new ValidationError("Invalid date/time input.");
    }
    if (endsAt.getTime() <= startsAt.getTime()) {
      throw new ValidationError("End time must be after start time.");
    }
    if (startsAt.getTime() <= now.getTime()) {
      throw new ExternalOpenPlayStartsInPastError();
    }

    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      const created = await this.externalOpenPlayRepository.insert(
        {
          hostProfileId,
          placeId: input.placeId,
          sportId: input.sportId,
          courtLabel: toStoredCourtSummaryLabel(input.courts),
          startsAt,
          endsAt,
          status: "ACTIVE",
          visibility: input.visibility,
          joinPolicy: input.joinPolicy,
          maxPlayers: input.maxPlayers,
          title: input.title,
          note: input.note,
          sourcePlatform: input.sourcePlatform,
          sourceReference: input.sourceReference,
        },
        ctx,
      );

      await this.externalOpenPlayRepository.insertCourts(
        created.id,
        input.courts,
        ctx,
      );

      await this.externalOpenPlayParticipantRepository.create(
        {
          externalOpenPlayId: created.id,
          profileId: hostProfileId,
          role: "HOST",
          status: "CONFIRMED",
          message: null,
          decidedAt: new Date(),
          decidedByProfileId: hostProfileId,
        },
        ctx,
      );

      logger.info(
        {
          event: "external_open_play.created",
          externalOpenPlayId: created.id,
          userId,
          hostProfileId,
        },
        "External Open Play created",
      );

      return created;
    });
  }

  async requestToJoin(
    userId: string,
    profileId: string,
    input: RequestJoinExternalOpenPlayDTO,
  ): Promise<{ participant: ExternalOpenPlayParticipantRecord }> {
    const now = new Date();

    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      const context = await this.externalOpenPlayRepository.getDetailContext(
        input.externalOpenPlayId,
        now,
        ctx,
      );
      if (!context) {
        throw new ExternalOpenPlayNotFoundError(input.externalOpenPlayId);
      }

      this.assertActiveAndFuture(context, now);

      if (context.host.profileId === profileId) {
        throw new ExternalOpenPlayCannotJoinOwnError();
      }

      const existing =
        await this.externalOpenPlayParticipantRepository.findByOpenPlayIdAndProfileId(
          context.externalOpenPlay.id,
          profileId,
          ctx,
        );
      if (existing) {
        throw new ExternalOpenPlayAlreadyParticipatingError(existing.status);
      }

      const joinPolicy = context.externalOpenPlay
        .joinPolicy as ExternalOpenPlayJoinPolicy;
      const nextStatus: ExternalOpenPlayParticipantStatus =
        joinPolicy === "AUTO" ? "CONFIRMED" : "REQUESTED";

      const confirmedCount = context.counts.confirmed;
      const full =
        confirmedCount >= Number(context.externalOpenPlay.maxPlayers ?? 0);

      const participant =
        await this.externalOpenPlayParticipantRepository.create(
          {
            externalOpenPlayId: context.externalOpenPlay.id,
            profileId,
            role: "PLAYER",
            status: full ? "WAITLISTED" : nextStatus,
            message: input.message ?? null,
            decidedAt: full || nextStatus === "CONFIRMED" ? new Date() : null,
            decidedByProfileId:
              full || nextStatus === "CONFIRMED"
                ? context.host.profileId
                : null,
          },
          ctx,
        );

      logger.info(
        {
          event: "external_open_play.join_requested",
          externalOpenPlayId: context.externalOpenPlay.id,
          participantId: participant.id,
          userId,
          profileId,
          status: participant.status,
        },
        "External Open Play join processed",
      );

      return { participant };
    });
  }

  async leave(
    userId: string,
    profileId: string,
    input: LeaveExternalOpenPlayDTO,
  ): Promise<{
    participant: ExternalOpenPlayParticipantRecord | null;
    previousStatus: ExternalOpenPlayParticipantStatus | null;
  }> {
    const now = new Date();

    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      const context = await this.externalOpenPlayRepository.getDetailContext(
        input.externalOpenPlayId,
        now,
        ctx,
      );

      if (!context) {
        throw new ExternalOpenPlayNotFoundError(input.externalOpenPlayId);
      }

      if (context.host.profileId === profileId) {
        throw new ExternalOpenPlayNotHostError();
      }

      const existing =
        await this.externalOpenPlayParticipantRepository.findByOpenPlayIdAndProfileId(
          context.externalOpenPlay.id,
          profileId,
          ctx,
        );
      if (!existing) {
        return { participant: null, previousStatus: null };
      }

      const previousStatus =
        existing.status as ExternalOpenPlayParticipantStatus;
      const participant =
        await this.externalOpenPlayParticipantRepository.update(
          existing.id,
          {
            status: "LEFT",
            decidedAt: new Date(),
            decidedByProfileId: profileId,
          },
          ctx,
        );

      logger.info(
        {
          event: "external_open_play.left",
          externalOpenPlayId: context.externalOpenPlay.id,
          participantId: participant.id,
          userId,
          profileId,
          previousStatus,
        },
        "External Open Play participant left",
      );

      return { participant, previousStatus };
    });
  }

  async decideParticipant(
    userId: string,
    hostProfileId: string,
    input: DecideExternalOpenPlayParticipantDTO,
  ): Promise<{
    participant: ExternalOpenPlayParticipantRecord;
    previousStatus: ExternalOpenPlayParticipantStatus;
    externalOpenPlayId: string;
  }> {
    const now = new Date();

    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      const participant =
        await this.externalOpenPlayParticipantRepository.findById(
          input.externalParticipantId,
          ctx,
        );

      if (!participant) {
        throw new ExternalOpenPlayNotFoundError("participant");
      }

      const row = await this.externalOpenPlayRepository.findByIdForUpdate(
        participant.externalOpenPlayId,
        ctx,
      );
      if (!row || row.status === "HIDDEN") {
        throw new ExternalOpenPlayNotFoundError(participant.externalOpenPlayId);
      }
      if (row.hostProfileId !== hostProfileId) {
        throw new ExternalOpenPlayNotHostError();
      }
      if (row.status !== "ACTIVE") {
        throw new ExternalOpenPlayNotActiveError(row.status);
      }
      if (new Date(row.startsAt).getTime() <= now.getTime()) {
        throw new ExternalOpenPlayStartsInPastError();
      }

      const previousStatus =
        participant.status as ExternalOpenPlayParticipantStatus;

      if (input.decision === "CONFIRM" && previousStatus !== "CONFIRMED") {
        const confirmed =
          await this.externalOpenPlayParticipantRepository.listWithProfilesByOpenPlayId(
            row.id,
            ["CONFIRMED"],
            ctx,
          );
        if (confirmed.length >= row.maxPlayers) {
          throw new ExternalOpenPlayCapacityReachedError(row.maxPlayers);
        }
      }

      const nextStatus: ExternalOpenPlayParticipantStatus =
        input.decision === "CONFIRM"
          ? "CONFIRMED"
          : input.decision === "WAITLIST"
            ? "WAITLISTED"
            : "DECLINED";

      const updated = await this.externalOpenPlayParticipantRepository.update(
        participant.id,
        {
          status: nextStatus,
          decidedAt: new Date(),
          decidedByProfileId: hostProfileId,
        },
        ctx,
      );

      logger.info(
        {
          event: "external_open_play.participant_decided",
          externalOpenPlayId: row.id,
          participantId: participant.id,
          userId,
          hostProfileId,
          previousStatus,
          nextStatus,
        },
        "External Open Play participant decision recorded",
      );

      return {
        participant: updated,
        previousStatus,
        externalOpenPlayId: row.id,
      };
    });
  }

  async close(
    userId: string,
    hostProfileId: string,
    input: CloseExternalOpenPlayDTO,
  ): Promise<ExternalOpenPlayRecord> {
    const now = new Date();
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      const row = await this.externalOpenPlayRepository.findByIdForUpdate(
        input.externalOpenPlayId,
        ctx,
      );
      if (!row || row.status === "HIDDEN") {
        throw new ExternalOpenPlayNotFoundError(input.externalOpenPlayId);
      }
      if (row.hostProfileId !== hostProfileId) {
        throw new ExternalOpenPlayNotHostError();
      }
      if (new Date(row.startsAt).getTime() <= now.getTime()) {
        throw new ExternalOpenPlayStartsInPastError();
      }

      const updated = await this.externalOpenPlayRepository.update(
        row.id,
        { status: "CLOSED" },
        ctx,
      );

      logger.info(
        {
          event: "external_open_play.closed",
          externalOpenPlayId: updated.id,
          userId,
          hostProfileId,
        },
        "External Open Play closed",
      );

      return updated;
    });
  }

  async cancel(
    userId: string,
    hostProfileId: string,
    input: CancelExternalOpenPlayDTO,
  ): Promise<ExternalOpenPlayRecord> {
    const now = new Date();
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      const row = await this.externalOpenPlayRepository.findByIdForUpdate(
        input.externalOpenPlayId,
        ctx,
      );
      if (!row || row.status === "HIDDEN") {
        throw new ExternalOpenPlayNotFoundError(input.externalOpenPlayId);
      }
      if (row.hostProfileId !== hostProfileId) {
        throw new ExternalOpenPlayNotHostError();
      }
      if (new Date(row.startsAt).getTime() <= now.getTime()) {
        throw new ExternalOpenPlayStartsInPastError();
      }

      const updated = await this.externalOpenPlayRepository.update(
        row.id,
        { status: "CANCELLED" },
        ctx,
      );

      logger.info(
        {
          event: "external_open_play.cancelled",
          externalOpenPlayId: updated.id,
          userId,
          hostProfileId,
        },
        "External Open Play cancelled",
      );

      return updated;
    });
  }

  async report(
    userId: string,
    reporterProfileId: string,
    input: ReportExternalOpenPlayDTO,
  ): Promise<{ reported: boolean; reportCount: number; hidden: boolean }> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      const row = await this.externalOpenPlayRepository.findByIdForUpdate(
        input.externalOpenPlayId,
        ctx,
      );
      if (!row || row.status === "HIDDEN") {
        throw new ExternalOpenPlayNotFoundError(input.externalOpenPlayId);
      }

      const report = await this.externalOpenPlayReportRepository.create(
        {
          externalOpenPlayId: row.id,
          reporterProfileId,
          reason: input.reason,
          details: input.details ?? null,
        },
        ctx,
      );

      const reportCount =
        await this.externalOpenPlayReportRepository.countByOpenPlayId(
          row.id,
          ctx,
        );

      const shouldHide =
        reportCount >= REPORT_HIDE_THRESHOLD && row.status === "ACTIVE";
      await this.externalOpenPlayRepository.update(
        row.id,
        {
          reportCount,
          ...(shouldHide ? { status: "HIDDEN" } : {}),
        },
        ctx,
      );

      logger.info(
        {
          event: "external_open_play.reported",
          externalOpenPlayId: row.id,
          userId,
          reporterProfileId,
          reason: input.reason,
          reportCount,
          hidden: shouldHide,
        },
        "External Open Play reported",
      );

      return { reported: Boolean(report), reportCount, hidden: shouldHide };
    });
  }

  async promoteToVerified(
    userId: string,
    hostProfileId: string,
    input: PromoteExternalOpenPlayDTO,
  ): Promise<{ openPlayId: string }> {
    const external = await this.externalOpenPlayRepository.findById(
      input.externalOpenPlayId,
    );
    if (!external || external.status === "HIDDEN") {
      throw new ExternalOpenPlayNotFoundError(input.externalOpenPlayId);
    }
    if (external.hostProfileId !== hostProfileId) {
      throw new ExternalOpenPlayNotHostError();
    }

    if (external.status === "PROMOTED" && external.promotedOpenPlayId) {
      return { openPlayId: external.promotedOpenPlayId };
    }

    const promoteTarget = await this.createVerifiedOpenPlayFromExternal(
      userId,
      hostProfileId,
      external,
      input,
    );

    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      const row = await this.externalOpenPlayRepository.findByIdForUpdate(
        external.id,
        ctx,
      );
      if (!row || row.status === "HIDDEN") {
        throw new ExternalOpenPlayNotFoundError(external.id);
      }

      if (row.status === "PROMOTED" && row.promotedOpenPlayId) {
        return { openPlayId: row.promotedOpenPlayId };
      }

      const participants =
        await this.externalOpenPlayParticipantRepository.listByOpenPlayId(
          row.id,
          ctx,
        );

      for (const participant of participants) {
        if (participant.role === "HOST") {
          continue;
        }
        const existing =
          await this.verifiedOpenPlayParticipantRepository.findByOpenPlayIdAndProfileId(
            promoteTarget.id,
            participant.profileId,
            ctx,
          );
        if (existing) {
          await this.verifiedOpenPlayParticipantRepository.update(
            existing.id,
            {
              status: participant.status,
              message: participant.message,
              decidedAt: participant.decidedAt,
              decidedByProfileId: participant.decidedByProfileId,
            },
            ctx,
          );
          continue;
        }

        await this.verifiedOpenPlayParticipantRepository.create(
          {
            openPlayId: promoteTarget.id,
            profileId: participant.profileId,
            role: "PLAYER",
            status: participant.status,
            message: participant.message,
            decidedAt: participant.decidedAt,
            decidedByProfileId: participant.decidedByProfileId,
          },
          ctx,
        );
      }

      await this.externalOpenPlayRepository.update(
        row.id,
        { status: "PROMOTED", promotedOpenPlayId: promoteTarget.id },
        ctx,
      );

      logger.info(
        {
          event: "external_open_play.promoted",
          externalOpenPlayId: row.id,
          openPlayId: promoteTarget.id,
          userId,
          hostProfileId,
        },
        "External Open Play promoted to verified Open Play",
      );

      return { openPlayId: promoteTarget.id };
    });
  }

  private async createVerifiedOpenPlayFromExternal(
    userId: string,
    hostProfileId: string,
    external: ExternalOpenPlayRecord,
    input: PromoteExternalOpenPlayDTO,
  ) {
    if (input.reservationId) {
      await this.assertReservationMatch(
        hostProfileId,
        external,
        input.reservationId,
      );
      return this.verifiedOpenPlayService.createFromReservation(
        userId,
        hostProfileId,
        {
          reservationId: input.reservationId,
          maxPlayers: external.maxPlayers,
          joinPolicy: external.joinPolicy as "REQUEST" | "AUTO",
          visibility: external.visibility as "PUBLIC" | "UNLISTED",
          title: external.title ?? undefined,
          note: external.note ?? undefined,
          paymentInstructions: undefined,
          paymentLinkUrl: undefined,
        },
      );
    }

    if (!input.reservationGroupId) {
      throw new ValidationError(
        "Provide exactly one of reservationId or reservationGroupId.",
      );
    }

    await this.assertReservationGroupMatch(
      hostProfileId,
      external,
      input.reservationGroupId,
    );
    return this.verifiedOpenPlayService.createFromReservationGroup(
      userId,
      hostProfileId,
      {
        reservationGroupId: input.reservationGroupId,
        maxPlayers: external.maxPlayers,
        joinPolicy: external.joinPolicy as "REQUEST" | "AUTO",
        visibility: external.visibility as "PUBLIC" | "UNLISTED",
        title: external.title ?? undefined,
        note: external.note ?? undefined,
        paymentInstructions: undefined,
        paymentLinkUrl: undefined,
      },
    );
  }

  private async assertReservationMatch(
    hostProfileId: string,
    external: ExternalOpenPlayRecord,
    reservationId: string,
  ): Promise<void> {
    await this.transactionManager.run(async (tx) => {
      const client = tx as DrizzleTransaction;
      const [row] = await client
        .select({
          playerId: reservation.playerId,
          status: reservation.status,
          startTime: reservation.startTime,
          endTime: reservation.endTime,
          placeId: court.placeId,
          sportId: court.sportId,
        })
        .from(reservation)
        .innerJoin(court, eq(reservation.courtId, court.id))
        .where(eq(reservation.id, reservationId))
        .limit(1);

      if (!row) {
        throw new ReservationNotFoundError(reservationId);
      }
      if (row.playerId !== hostProfileId) {
        throw new ExternalOpenPlayNotHostError();
      }
      if (row.status === "CANCELLED" || row.status === "EXPIRED") {
        throw new ExternalOpenPlayNotActiveError(row.status);
      }

      const matches =
        row.placeId === external.placeId &&
        row.sportId === external.sportId &&
        row.startTime.getTime() === new Date(external.startsAt).getTime() &&
        row.endTime.getTime() === new Date(external.endsAt).getTime();

      if (!matches) {
        throw new ExternalOpenPlayPromotionMismatchError();
      }
    });
  }

  private async assertReservationGroupMatch(
    hostProfileId: string,
    external: ExternalOpenPlayRecord,
    reservationGroupId: string,
  ): Promise<void> {
    await this.transactionManager.run(async (tx) => {
      const client = tx as DrizzleTransaction;

      const [group] = await client
        .select({
          id: reservationGroup.id,
          placeId: reservationGroup.placeId,
          playerId: reservationGroup.playerId,
        })
        .from(reservationGroup)
        .where(eq(reservationGroup.id, reservationGroupId))
        .limit(1);

      if (!group) {
        throw new ReservationNotFoundError(reservationGroupId);
      }
      if (group.playerId !== hostProfileId) {
        throw new ExternalOpenPlayNotHostError();
      }

      const reservations = await client
        .select({
          status: reservation.status,
          startTime: reservation.startTime,
          endTime: reservation.endTime,
          courtId: reservation.courtId,
        })
        .from(reservation)
        .where(eq(reservation.groupId, reservationGroupId))
        .orderBy(asc(reservation.startTime));

      if (reservations.length === 0) {
        throw new ReservationNotFoundError(reservationGroupId);
      }

      for (const res of reservations) {
        if (res.status === "CANCELLED" || res.status === "EXPIRED") {
          throw new ExternalOpenPlayNotActiveError(res.status);
        }
      }

      const earliestStart = reservations.reduce(
        (min, row) => (row.startTime < min ? row.startTime : min),
        reservations[0].startTime,
      );
      const latestEnd = reservations.reduce(
        (max, row) => (row.endTime > max ? row.endTime : max),
        reservations[0].endTime,
      );

      const firstCourtId = reservations[0].courtId;
      const [courtRow] = await client
        .select({ sportId: court.sportId })
        .from(court)
        .where(eq(court.id, firstCourtId))
        .limit(1);

      if (!courtRow) {
        throw new CourtNotFoundError(firstCourtId);
      }

      const matches =
        group.placeId === external.placeId &&
        courtRow.sportId === external.sportId &&
        earliestStart.getTime() === new Date(external.startsAt).getTime() &&
        latestEnd.getTime() === new Date(external.endsAt).getTime();

      if (!matches) {
        throw new ExternalOpenPlayPromotionMismatchError();
      }
    });
  }
}
