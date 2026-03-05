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
  reservationGroup,
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
  courtLabels: string[];
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
  courts: {
    id: string;
    label: string;
  }[];
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
  findByReservationGroupId(
    reservationGroupId: string,
    ctx?: RequestContext,
  ): Promise<OpenPlayRecord | null>;
  upsertByReservationId(
    data: InsertOpenPlay,
    ctx?: RequestContext,
  ): Promise<OpenPlayRecord>;
  insert(data: InsertOpenPlay, ctx?: RequestContext): Promise<OpenPlayRecord>;
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

const COURT_LABEL_DELIMITER = "|||";

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

  async findByReservationGroupId(
    reservationGroupId: string,
    ctx?: RequestContext,
  ): Promise<OpenPlayRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(openPlay)
      .where(eq(openPlay.reservationGroupId, reservationGroupId))
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

  async insert(
    data: InsertOpenPlay,
    ctx?: RequestContext,
  ): Promise<OpenPlayRecord> {
    const client = this.getClient(ctx);
    const result = await client.insert(openPlay).values(data).returning();
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
      // For single-court: require confirmed reservation still in the future.
      // For group: rely on openPlay.status being ACTIVE (service manages lifecycle).
      sql`(
        (${openPlay.reservationId} IS NOT NULL AND ${reservation.status} = 'CONFIRMED' AND ${reservation.endTime} > ${toIso(now)})
        OR
        (${openPlay.reservationGroupId} IS NOT NULL)
      )`,
    ];

    if (options.from) {
      conditions.push(gt(openPlay.startsAt, options.from));
    }
    if (options.to) {
      conditions.push(lt(openPlay.startsAt, options.to));
    }

    // Correlated subquery for confirmed count — avoids GROUP BY complexity.
    const confirmedCountSql = sql<number>`(
      SELECT count(*)
      FROM open_play_participant opp
      WHERE opp.open_play_id = ${openPlay.id}
        AND opp.status = 'CONFIRMED'
    )`;

    // Court labels: single-court uses court.label; group aggregates from the group's reservations.
    const courtLabelsSql = sql<string>`CASE
      WHEN ${openPlay.courtId} IS NOT NULL THEN ${court.label}
      ELSE (
        SELECT string_agg(sub_c.label, ${COURT_LABEL_DELIMITER} ORDER BY sub_c.label)
        FROM court sub_c
        JOIN reservation sub_r ON sub_r.court_id = sub_c.id
        WHERE sub_r.group_id = ${openPlay.reservationGroupId}
      )
    END`;

    const priceCentsSql = sql<number>`COALESCE(${reservation.totalPriceCents}, ${reservationGroup.totalPriceCents}, 0)`;
    const currencySql = sql<string>`COALESCE(${reservation.currency}, ${reservationGroup.currency}, 'PHP')`;

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
        reservationTotalPriceCents: priceCentsSql,
        currency: currencySql,
        courtLabelsRaw: courtLabelsSql,
        sportName: sport.name,
        hostProfileId: profile.id,
        hostDisplayName: profile.displayName,
        hostAvatarUrl: profile.avatarUrl,
      })
      .from(openPlay)
      .leftJoin(reservation, eq(openPlay.reservationId, reservation.id))
      .leftJoin(
        reservationGroup,
        eq(openPlay.reservationGroupId, reservationGroup.id),
      )
      .leftJoin(court, eq(openPlay.courtId, court.id))
      .innerJoin(sport, eq(openPlay.sportId, sport.id))
      .innerJoin(profile, eq(openPlay.hostProfileId, profile.id))
      .where(and(...conditions))
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
      reservationTotalPriceCents: Number(r.reservationTotalPriceCents ?? 0),
      currency: String(r.currency ?? "PHP"),
      courtLabels: String(r.courtLabelsRaw ?? "Court").split(
        COURT_LABEL_DELIMITER,
      ),
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

    // Participant counts
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

    // Base open play data with place, sport, host (works for both types)
    const [baseRow] = await client
      .select({
        openPlay,
        placeId: place.id,
        placeName: place.name,
        placeTimeZone: place.timeZone,
        sportId: sport.id,
        sportName: sport.name,
        hostProfileId: profile.id,
        hostUserId: profile.userId,
        hostDisplayName: profile.displayName,
        hostAvatarUrl: profile.avatarUrl,
      })
      .from(openPlay)
      .innerJoin(place, eq(openPlay.placeId, place.id))
      .innerJoin(sport, eq(openPlay.sportId, sport.id))
      .innerJoin(profile, eq(openPlay.hostProfileId, profile.id))
      .where(and(eq(openPlay.id, openPlayId), gt(openPlay.endsAt, now)))
      .limit(1);

    if (!baseRow) {
      return null;
    }

    const op = baseRow.openPlay;

    let courts: { id: string; label: string }[];
    let reservationStatus: string;
    let reservationTotalPriceCents: number;
    let currency: string;

    if (op.reservationId) {
      // ── Single-court path ──
      const [resRow] = await client
        .select({
          status: reservation.status,
          startTime: reservation.startTime,
          endTime: reservation.endTime,
          totalPriceCents: reservation.totalPriceCents,
          currency: reservation.currency,
          courtId: court.id,
          courtLabel: court.label,
        })
        .from(reservation)
        .innerJoin(court, eq(reservation.courtId, court.id))
        .where(eq(reservation.id, op.reservationId))
        .limit(1);

      if (!resRow || resRow.endTime <= now) {
        return null;
      }

      courts = [{ id: resRow.courtId, label: resRow.courtLabel }];
      reservationStatus = resRow.status;
      reservationTotalPriceCents = resRow.totalPriceCents;
      currency = resRow.currency;
    } else if (op.reservationGroupId) {
      // ── Group path ──
      const groupRows = await client
        .select({
          status: reservation.status,
          courtId: court.id,
          courtLabel: court.label,
        })
        .from(reservation)
        .innerJoin(court, eq(reservation.courtId, court.id))
        .where(eq(reservation.groupId, op.reservationGroupId))
        .orderBy(asc(court.label));

      courts = groupRows.map((r) => ({ id: r.courtId, label: r.courtLabel }));

      const allConfirmed = groupRows.every((r) => r.status === "CONFIRMED");
      reservationStatus = allConfirmed
        ? "CONFIRMED"
        : (groupRows[0]?.status ?? "CREATED");

      // Group-level pricing
      const [groupRow] = await client
        .select({
          totalPriceCents: reservationGroup.totalPriceCents,
          currency: reservationGroup.currency,
        })
        .from(reservationGroup)
        .where(eq(reservationGroup.id, op.reservationGroupId))
        .limit(1);

      reservationTotalPriceCents = groupRow?.totalPriceCents ?? 0;
      currency = groupRow?.currency ?? "PHP";
    } else {
      return null;
    }

    return {
      openPlay: op,
      reservationStatus,
      reservationStartTimeIso: toIso(op.startsAt),
      reservationEndTimeIso: toIso(op.endsAt),
      reservationTotalPriceCents,
      currency,
      place: {
        id: baseRow.placeId,
        name: baseRow.placeName,
        timeZone: baseRow.placeTimeZone,
      },
      courts,
      sport: {
        id: baseRow.sportId,
        name: baseRow.sportName,
      },
      host: {
        profileId: baseRow.hostProfileId,
        userId: baseRow.hostUserId,
        displayName: baseRow.hostDisplayName,
        avatarUrl: baseRow.hostAvatarUrl,
      },
      counts: {
        confirmed: countsByStatus.get("CONFIRMED") ?? 0,
        requested: countsByStatus.get("REQUESTED") ?? 0,
        waitlisted: countsByStatus.get("WAITLISTED") ?? 0,
      },
    };
  }
}
