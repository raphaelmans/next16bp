import { and, asc, count, eq, gt, lt, sql } from "drizzle-orm";
import {
  court,
  type InsertOpenPlay,
  type OpenPlayRecord,
  openPlay,
  openPlayParticipant,
  place,
  profile,
  reservation,
  sport,
} from "@/lib/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/lib/shared/infra/db/types";
import type { RequestContext } from "@/lib/shared/kernel/context";

export interface OpenPlayListItemRecord {
  id: string;
  startsAtIso: string;
  endsAtIso: string;
  status: string;
  visibility: string;
  joinPolicy: string;
  maxPlayers: number;
  confirmedCount: number;
  title: string | null;
  note: string | null;
  paymentInstructions: string | null;
  paymentLinkUrl: string | null;
  reservationTotalPriceCents: number;
  currency: string;
  courtLabel: string;
  sportName: string;
  host: {
    profileId: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

export interface OpenPlayDetailContextRecord {
  openPlay: OpenPlayRecord;
  reservationStatus: string;
  reservationStartTimeIso: string;
  reservationEndTimeIso: string;
  reservationTotalPriceCents: number;
  currency: string;
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
    userId: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  counts: {
    confirmed: number;
    requested: number;
    waitlisted: number;
  };
}

export interface IOpenPlayRepository {
  findById(id: string, ctx?: RequestContext): Promise<OpenPlayRecord | null>;
  findByReservationId(
    reservationId: string,
    ctx?: RequestContext,
  ): Promise<OpenPlayRecord | null>;
  upsertByReservationId(
    data: InsertOpenPlay,
    ctx?: RequestContext,
  ): Promise<OpenPlayRecord>;
  listPublicUpcomingByPlace(
    placeId: string,
    now: Date,
    options: { from?: Date; to?: Date; limit: number },
    ctx?: RequestContext,
  ): Promise<OpenPlayListItemRecord[]>;
  getDetailContext(
    openPlayId: string,
    now: Date,
    ctx?: RequestContext,
  ): Promise<OpenPlayDetailContextRecord | null>;
}

const toIso = (value: Date | string) =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

export class OpenPlayRepository implements IOpenPlayRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findById(
    id: string,
    ctx?: RequestContext,
  ): Promise<OpenPlayRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(openPlay)
      .where(eq(openPlay.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findByReservationId(
    reservationId: string,
    ctx?: RequestContext,
  ): Promise<OpenPlayRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(openPlay)
      .where(eq(openPlay.reservationId, reservationId))
      .limit(1);
    return result[0] ?? null;
  }

  async upsertByReservationId(
    data: InsertOpenPlay,
    ctx?: RequestContext,
  ): Promise<OpenPlayRecord> {
    const client = this.getClient(ctx);

    const result = await client
      .insert(openPlay)
      .values(data)
      .onConflictDoUpdate({
        target: openPlay.reservationId,
        set: {
          hostProfileId: data.hostProfileId,
          placeId: data.placeId,
          courtId: data.courtId,
          sportId: data.sportId,
          startsAt: data.startsAt,
          endsAt: data.endsAt,
          status: data.status,
          visibility: data.visibility,
          joinPolicy: data.joinPolicy,
          maxPlayers: data.maxPlayers,
          title: data.title,
          note: data.note,
          paymentInstructions: data.paymentInstructions,
          paymentLinkUrl: data.paymentLinkUrl,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  }

  async listPublicUpcomingByPlace(
    placeId: string,
    now: Date,
    options: { from?: Date; to?: Date; limit: number },
    ctx?: RequestContext,
  ): Promise<OpenPlayListItemRecord[]> {
    const client = this.getClient(ctx);

    const conditions = [
      eq(openPlay.placeId, placeId),
      eq(openPlay.status, "ACTIVE"),
      eq(openPlay.visibility, "PUBLIC"),
      gt(openPlay.startsAt, now),
      eq(reservation.status, "CONFIRMED"),
      gt(reservation.endTime, now),
    ];

    if (options.from) {
      conditions.push(gt(openPlay.startsAt, options.from));
    }
    if (options.to) {
      conditions.push(lt(openPlay.startsAt, options.to));
    }

    const confirmedCountSql = sql<number>`count(${openPlayParticipant.id}) filter (where ${openPlayParticipant.status} = 'CONFIRMED')`;

    const rows = await client
      .select({
        id: openPlay.id,
        startsAt: openPlay.startsAt,
        endsAt: openPlay.endsAt,
        status: openPlay.status,
        visibility: openPlay.visibility,
        joinPolicy: openPlay.joinPolicy,
        maxPlayers: openPlay.maxPlayers,
        confirmedCount: confirmedCountSql,
        title: openPlay.title,
        note: openPlay.note,
        paymentInstructions: openPlay.paymentInstructions,
        paymentLinkUrl: openPlay.paymentLinkUrl,
        reservationTotalPriceCents: reservation.totalPriceCents,
        currency: reservation.currency,
        courtLabel: court.label,
        sportName: sport.name,
        hostProfileId: profile.id,
        hostDisplayName: profile.displayName,
        hostAvatarUrl: profile.avatarUrl,
      })
      .from(openPlay)
      .innerJoin(reservation, eq(openPlay.reservationId, reservation.id))
      .innerJoin(court, eq(openPlay.courtId, court.id))
      .innerJoin(sport, eq(openPlay.sportId, sport.id))
      .innerJoin(profile, eq(openPlay.hostProfileId, profile.id))
      .leftJoin(
        openPlayParticipant,
        eq(openPlayParticipant.openPlayId, openPlay.id),
      )
      .where(and(...conditions))
      .groupBy(
        openPlay.id,
        openPlay.startsAt,
        openPlay.endsAt,
        openPlay.status,
        openPlay.visibility,
        openPlay.joinPolicy,
        openPlay.maxPlayers,
        openPlay.title,
        openPlay.note,
        openPlay.paymentInstructions,
        openPlay.paymentLinkUrl,
        reservation.totalPriceCents,
        reservation.currency,
        court.label,
        sport.name,
        profile.id,
        profile.displayName,
        profile.avatarUrl,
      )
      .orderBy(asc(openPlay.startsAt))
      .limit(options.limit);

    return rows.map((r) => ({
      id: r.id,
      startsAtIso: toIso(r.startsAt),
      endsAtIso: toIso(r.endsAt),
      status: r.status,
      visibility: r.visibility,
      joinPolicy: r.joinPolicy,
      maxPlayers: r.maxPlayers,
      confirmedCount: Number(r.confirmedCount ?? 0),
      title: r.title ?? null,
      note: r.note ?? null,
      paymentInstructions: r.paymentInstructions ?? null,
      paymentLinkUrl: r.paymentLinkUrl ?? null,
      reservationTotalPriceCents: r.reservationTotalPriceCents,
      currency: r.currency,
      courtLabel: r.courtLabel,
      sportName: r.sportName,
      host: {
        profileId: r.hostProfileId,
        displayName: r.hostDisplayName ?? null,
        avatarUrl: r.hostAvatarUrl ?? null,
      },
    }));
  }

  async getDetailContext(
    openPlayId: string,
    now: Date,
    ctx?: RequestContext,
  ): Promise<OpenPlayDetailContextRecord | null> {
    const client = this.getClient(ctx);

    const counts = await client
      .select({
        openPlayId: openPlayParticipant.openPlayId,
        status: openPlayParticipant.status,
        count: count(),
      })
      .from(openPlayParticipant)
      .where(eq(openPlayParticipant.openPlayId, openPlayId))
      .groupBy(openPlayParticipant.openPlayId, openPlayParticipant.status);

    const countsByStatus = new Map<string, number>();
    for (const row of counts) {
      countsByStatus.set(row.status, Number(row.count ?? 0));
    }

    const [row] = await client
      .select({
        openPlay,
        reservationStatus: reservation.status,
        reservationStartTime: reservation.startTime,
        reservationEndTime: reservation.endTime,
        reservationTotalPriceCents: reservation.totalPriceCents,
        reservationCurrency: reservation.currency,
        placeId: place.id,
        placeName: place.name,
        placeTimeZone: place.timeZone,
        courtId: court.id,
        courtLabel: court.label,
        sportId: sport.id,
        sportName: sport.name,
        hostProfileId: profile.id,
        hostUserId: profile.userId,
        hostDisplayName: profile.displayName,
        hostAvatarUrl: profile.avatarUrl,
      })
      .from(openPlay)
      .innerJoin(reservation, eq(openPlay.reservationId, reservation.id))
      .innerJoin(place, eq(openPlay.placeId, place.id))
      .innerJoin(court, eq(openPlay.courtId, court.id))
      .innerJoin(sport, eq(openPlay.sportId, sport.id))
      .innerJoin(profile, eq(openPlay.hostProfileId, profile.id))
      .where(and(eq(openPlay.id, openPlayId), gt(reservation.endTime, now)))
      .limit(1);

    if (!row) {
      return null;
    }

    return {
      openPlay: row.openPlay,
      reservationStatus: row.reservationStatus,
      reservationStartTimeIso: toIso(row.reservationStartTime),
      reservationEndTimeIso: toIso(row.reservationEndTime),
      reservationTotalPriceCents: row.reservationTotalPriceCents,
      currency: row.reservationCurrency,
      place: {
        id: row.placeId,
        name: row.placeName,
        timeZone: row.placeTimeZone,
      },
      court: {
        id: row.courtId,
        label: row.courtLabel,
      },
      sport: {
        id: row.sportId,
        name: row.sportName,
      },
      host: {
        profileId: row.hostProfileId,
        userId: row.hostUserId,
        displayName: row.hostDisplayName,
        avatarUrl: row.hostAvatarUrl,
      },
      counts: {
        confirmed: countsByStatus.get("CONFIRMED") ?? 0,
        requested: countsByStatus.get("REQUESTED") ?? 0,
        waitlisted: countsByStatus.get("WAITLISTED") ?? 0,
      },
    };
  }
}
