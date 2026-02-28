import { and, asc, count, eq, gt, lt, sql } from "drizzle-orm";
import {
  type ExternalOpenPlayRecord,
  externalOpenPlay,
  externalOpenPlayParticipant,
  type InsertExternalOpenPlay,
  place,
  profile,
  sport,
} from "@/lib/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/lib/shared/infra/db/types";
import type { RequestContext } from "@/lib/shared/kernel/context";

export interface ExternalOpenPlayListItemRecord {
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
  courtLabel: string | null;
  sportName: string;
  sourcePlatform: string;
  reportCount: number;
  host: {
    profileId: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

export interface ExternalOpenPlayDetailContextRecord {
  externalOpenPlay: ExternalOpenPlayRecord;
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

export interface IExternalOpenPlayRepository {
  findById(
    id: string,
    ctx?: RequestContext,
  ): Promise<ExternalOpenPlayRecord | null>;
  findByIdForUpdate(
    id: string,
    ctx?: RequestContext,
  ): Promise<ExternalOpenPlayRecord | null>;
  insert(
    data: InsertExternalOpenPlay,
    ctx?: RequestContext,
  ): Promise<ExternalOpenPlayRecord>;
  update(
    id: string,
    data: Partial<InsertExternalOpenPlay>,
    ctx?: RequestContext,
  ): Promise<ExternalOpenPlayRecord>;
  listPublicUpcomingByPlace(
    placeId: string,
    now: Date,
    options: { from?: Date; to?: Date; limit: number },
    ctx?: RequestContext,
  ): Promise<ExternalOpenPlayListItemRecord[]>;
  getDetailContext(
    externalOpenPlayId: string,
    now: Date,
    ctx?: RequestContext,
  ): Promise<ExternalOpenPlayDetailContextRecord | null>;
}

const toIso = (value: Date | string) =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

export class ExternalOpenPlayRepository implements IExternalOpenPlayRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findById(
    id: string,
    ctx?: RequestContext,
  ): Promise<ExternalOpenPlayRecord | null> {
    const client = this.getClient(ctx);
    const [row] = await client
      .select()
      .from(externalOpenPlay)
      .where(eq(externalOpenPlay.id, id))
      .limit(1);
    return row ?? null;
  }

  async findByIdForUpdate(
    id: string,
    ctx?: RequestContext,
  ): Promise<ExternalOpenPlayRecord | null> {
    const client = this.getClient(ctx);
    const [row] = await client
      .select()
      .from(externalOpenPlay)
      .where(eq(externalOpenPlay.id, id))
      .for("update")
      .limit(1);
    return row ?? null;
  }

  async insert(
    data: InsertExternalOpenPlay,
    ctx?: RequestContext,
  ): Promise<ExternalOpenPlayRecord> {
    const client = this.getClient(ctx);
    const [row] = await client
      .insert(externalOpenPlay)
      .values(data)
      .returning();
    return row;
  }

  async update(
    id: string,
    data: Partial<InsertExternalOpenPlay>,
    ctx?: RequestContext,
  ): Promise<ExternalOpenPlayRecord> {
    const client = this.getClient(ctx);
    const [row] = await client
      .update(externalOpenPlay)
      .set({ ...data, updatedAt: sql`now()` })
      .where(eq(externalOpenPlay.id, id))
      .returning();
    return row;
  }

  async listPublicUpcomingByPlace(
    placeId: string,
    now: Date,
    options: { from?: Date; to?: Date; limit: number },
    ctx?: RequestContext,
  ): Promise<ExternalOpenPlayListItemRecord[]> {
    const client = this.getClient(ctx);

    const conditions = [
      eq(externalOpenPlay.placeId, placeId),
      eq(externalOpenPlay.status, "ACTIVE"),
      eq(externalOpenPlay.visibility, "PUBLIC"),
      gt(externalOpenPlay.startsAt, now),
      gt(externalOpenPlay.endsAt, now),
    ];

    if (options.from) {
      conditions.push(gt(externalOpenPlay.startsAt, options.from));
    }
    if (options.to) {
      conditions.push(lt(externalOpenPlay.startsAt, options.to));
    }

    const confirmedCountSql = sql<number>`(
      SELECT count(*)
      FROM external_open_play_participant eopp
      WHERE eopp.external_open_play_id = ${externalOpenPlay.id}
        AND eopp.status = 'CONFIRMED'
    )`;

    const rows = await client
      .select({
        id: externalOpenPlay.id,
        startsAt: externalOpenPlay.startsAt,
        endsAt: externalOpenPlay.endsAt,
        status: externalOpenPlay.status,
        visibility: externalOpenPlay.visibility,
        joinPolicy: externalOpenPlay.joinPolicy,
        maxPlayers: externalOpenPlay.maxPlayers,
        confirmedCount: confirmedCountSql,
        title: externalOpenPlay.title,
        note: externalOpenPlay.note,
        courtLabel: externalOpenPlay.courtLabel,
        sportName: sport.name,
        sourcePlatform: externalOpenPlay.sourcePlatform,
        reportCount: externalOpenPlay.reportCount,
        hostProfileId: profile.id,
        hostDisplayName: profile.displayName,
        hostAvatarUrl: profile.avatarUrl,
      })
      .from(externalOpenPlay)
      .innerJoin(sport, eq(externalOpenPlay.sportId, sport.id))
      .innerJoin(profile, eq(externalOpenPlay.hostProfileId, profile.id))
      .where(and(...conditions))
      .orderBy(asc(externalOpenPlay.startsAt))
      .limit(options.limit);

    return rows.map((row) => ({
      id: row.id,
      startsAtIso: toIso(row.startsAt),
      endsAtIso: toIso(row.endsAt),
      status: row.status,
      visibility: row.visibility,
      joinPolicy: row.joinPolicy,
      maxPlayers: row.maxPlayers,
      confirmedCount: Number(row.confirmedCount ?? 0),
      title: row.title ?? null,
      note: row.note ?? null,
      courtLabel: row.courtLabel ?? null,
      sportName: row.sportName,
      sourcePlatform: row.sourcePlatform,
      reportCount: row.reportCount,
      host: {
        profileId: row.hostProfileId,
        displayName: row.hostDisplayName ?? null,
        avatarUrl: row.hostAvatarUrl ?? null,
      },
    }));
  }

  async getDetailContext(
    externalOpenPlayId: string,
    now: Date,
    ctx?: RequestContext,
  ): Promise<ExternalOpenPlayDetailContextRecord | null> {
    const client = this.getClient(ctx);

    const counts = await client
      .select({
        status: externalOpenPlayParticipant.status,
        value: count(),
      })
      .from(externalOpenPlayParticipant)
      .where(
        eq(externalOpenPlayParticipant.externalOpenPlayId, externalOpenPlayId),
      )
      .groupBy(externalOpenPlayParticipant.status);

    const countsByStatus = new Map<string, number>();
    for (const row of counts) {
      countsByStatus.set(row.status, Number(row.value ?? 0));
    }

    const [row] = await client
      .select({
        externalOpenPlay,
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
      .from(externalOpenPlay)
      .innerJoin(place, eq(externalOpenPlay.placeId, place.id))
      .innerJoin(sport, eq(externalOpenPlay.sportId, sport.id))
      .innerJoin(profile, eq(externalOpenPlay.hostProfileId, profile.id))
      .where(
        and(
          eq(externalOpenPlay.id, externalOpenPlayId),
          gt(externalOpenPlay.endsAt, now),
          sql`${externalOpenPlay.status} != 'HIDDEN'`,
        ),
      )
      .limit(1);

    if (!row) {
      return null;
    }

    return {
      externalOpenPlay: row.externalOpenPlay,
      place: {
        id: row.placeId,
        name: row.placeName,
        timeZone: row.placeTimeZone,
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
