import { and, count, eq, inArray } from "drizzle-orm";
import {
  court,
  courtRateRule,
  type InsertPlace,
  type InsertPlaceContactDetail,
  organizationReservationPolicy,
  type PlaceContactDetailRecord,
  type PlaceRecord,
  place,
  placeAmenity,
  placeContactDetail,
  placePhoto,
  sport,
} from "@/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/shared/infra/db/types";
import type { RequestContext } from "@/shared/kernel/context";

export interface PlaceWithDetails {
  place: PlaceRecord;
  contactDetail: typeof placeContactDetail.$inferSelect | null;
  reservationPolicy: typeof organizationReservationPolicy.$inferSelect | null;
  photos: (typeof placePhoto.$inferSelect)[];
  amenities: (typeof placeAmenity.$inferSelect)[];
}

export interface PlaceListItem {
  place: PlaceRecord;
  sports: { id: string; slug: string; name: string }[];
  courtCount: number;
  lowestPriceCents?: number;
  currency?: string;
}

export interface PaginatedPlaces {
  items: PlaceListItem[];
  total: number;
}

export interface IPlaceRepository {
  findById(id: string, ctx?: RequestContext): Promise<PlaceRecord | null>;
  findByIdForUpdate(
    id: string,
    ctx: RequestContext,
  ): Promise<PlaceRecord | null>;
  findWithDetails(
    id: string,
    ctx?: RequestContext,
  ): Promise<PlaceWithDetails | null>;
  findByOrganizationId(
    organizationId: string,
    ctx?: RequestContext,
  ): Promise<PlaceRecord[]>;
  list(
    filters: {
      city?: string;
      sportId?: string;
      limit: number;
      offset: number;
    },
    ctx?: RequestContext,
  ): Promise<PaginatedPlaces>;
  create(data: InsertPlace, ctx?: RequestContext): Promise<PlaceRecord>;
  update(
    id: string,
    data: Partial<InsertPlace>,
    ctx?: RequestContext,
  ): Promise<PlaceRecord>;
  upsertContactDetail(
    data: InsertPlaceContactDetail,
    ctx?: RequestContext,
  ): Promise<PlaceContactDetailRecord>;
}

export class PlaceRepository implements IPlaceRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findById(
    id: string,
    ctx?: RequestContext,
  ): Promise<PlaceRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(place)
      .where(eq(place.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  async findByIdForUpdate(
    id: string,
    ctx: RequestContext,
  ): Promise<PlaceRecord | null> {
    const client = this.getClient(ctx) as DrizzleTransaction;
    const result = await client
      .select()
      .from(place)
      .where(eq(place.id, id))
      .for("update")
      .limit(1);

    return result[0] ?? null;
  }

  async findWithDetails(
    id: string,
    ctx?: RequestContext,
  ): Promise<PlaceWithDetails | null> {
    const client = this.getClient(ctx);
    const placeResult = await client
      .select()
      .from(place)
      .where(eq(place.id, id))
      .limit(1);

    const placeRecord = placeResult[0];
    if (!placeRecord) return null;

    const contactResult = await client
      .select()
      .from(placeContactDetail)
      .where(eq(placeContactDetail.placeId, id))
      .limit(1);
    const contactDetail = contactResult[0] ?? null;

    let reservationPolicy:
      | typeof organizationReservationPolicy.$inferSelect
      | null = null;
    if (placeRecord.organizationId) {
      const policyResult = await client
        .select()
        .from(organizationReservationPolicy)
        .where(
          eq(
            organizationReservationPolicy.organizationId,
            placeRecord.organizationId,
          ),
        )
        .limit(1);
      reservationPolicy = policyResult[0] ?? null;
    }

    const photos = await client
      .select()
      .from(placePhoto)
      .where(eq(placePhoto.placeId, id))
      .orderBy(placePhoto.displayOrder);

    const amenities = await client
      .select()
      .from(placeAmenity)
      .where(eq(placeAmenity.placeId, id));

    return {
      place: placeRecord,
      contactDetail,
      reservationPolicy,
      photos,
      amenities,
    };
  }

  async findByOrganizationId(
    organizationId: string,
    ctx?: RequestContext,
  ): Promise<PlaceRecord[]> {
    const client = this.getClient(ctx);
    return client
      .select()
      .from(place)
      .where(eq(place.organizationId, organizationId));
  }

  async list(
    filters: {
      city?: string;
      sportId?: string;
      limit: number;
      offset: number;
    },
    ctx?: RequestContext,
  ): Promise<PaginatedPlaces> {
    const client = this.getClient(ctx);
    const conditions = [eq(place.isActive, true)];

    if (filters.city) {
      conditions.push(eq(place.city, filters.city));
    }

    const baseCondition = and(...conditions);

    if (filters.sportId) {
      const countResult = await client
        .select({ count: count() })
        .from(place)
        .innerJoin(court, eq(court.placeId, place.id))
        .where(and(baseCondition, eq(court.sportId, filters.sportId)));

      const placeRows = await client
        .select({ place })
        .from(place)
        .innerJoin(court, eq(court.placeId, place.id))
        .where(and(baseCondition, eq(court.sportId, filters.sportId)))
        .limit(filters.limit)
        .offset(filters.offset);

      const uniquePlaces = Array.from(
        new Map(placeRows.map((row) => [row.place.id, row.place])).values(),
      );
      const placeIds = uniquePlaces.map((placeRecord) => placeRecord.id);

      const sportsByPlace = await this.getSportsByPlaceIds(placeIds, client);
      const courtCounts = await this.getCourtCountsByPlaceIds(
        placeIds,
        filters.sportId,
        client,
      );
      const lowestPrices = await this.getLowestPriceByPlaceIds(
        placeIds,
        filters.sportId,
        client,
      );

      return {
        items: uniquePlaces.map((placeRecord) => {
          const lowestPrice = lowestPrices.get(placeRecord.id);
          return {
            place: placeRecord,
            sports: sportsByPlace.get(placeRecord.id) ?? [],
            courtCount: courtCounts.get(placeRecord.id) ?? 0,
            lowestPriceCents: lowestPrice?.priceCents,
            currency: lowestPrice?.currency,
          };
        }),
        total: countResult[0]?.count ?? 0,
      };
    }

    const countResult = await client
      .select({ count: count() })
      .from(place)
      .where(baseCondition);

    const placeRecords = await client
      .select()
      .from(place)
      .where(baseCondition)
      .limit(filters.limit)
      .offset(filters.offset);

    const placeIds = placeRecords.map((placeRecord) => placeRecord.id);

    const sportsByPlace = await this.getSportsByPlaceIds(placeIds, client);
    const courtCounts = await this.getCourtCountsByPlaceIds(
      placeIds,
      undefined,
      client,
    );
    const lowestPrices = await this.getLowestPriceByPlaceIds(
      placeIds,
      undefined,
      client,
    );

    return {
      items: placeRecords.map((placeRecord) => {
        const lowestPrice = lowestPrices.get(placeRecord.id);
        return {
          place: placeRecord,
          sports: sportsByPlace.get(placeRecord.id) ?? [],
          courtCount: courtCounts.get(placeRecord.id) ?? 0,
          lowestPriceCents: lowestPrice?.priceCents,
          currency: lowestPrice?.currency,
        };
      }),
      total: countResult[0]?.count ?? 0,
    };
  }

  async create(data: InsertPlace, ctx?: RequestContext): Promise<PlaceRecord> {
    const client = this.getClient(ctx);
    const result = await client.insert(place).values(data).returning();
    return result[0];
  }

  async update(
    id: string,
    data: Partial<InsertPlace>,
    ctx?: RequestContext,
  ): Promise<PlaceRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .update(place)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(place.id, id))
      .returning();

    return result[0];
  }

  async upsertContactDetail(
    data: InsertPlaceContactDetail,
    ctx?: RequestContext,
  ): Promise<PlaceContactDetailRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .insert(placeContactDetail)
      .values(data)
      .onConflictDoUpdate({
        target: placeContactDetail.placeId,
        set: {
          facebookUrl: data.facebookUrl ?? null,
          instagramUrl: data.instagramUrl ?? null,
          websiteUrl: data.websiteUrl ?? null,
          viberInfo: data.viberInfo ?? null,
          otherContactInfo: data.otherContactInfo ?? null,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  }

  private async getSportsByPlaceIds(
    placeIds: string[],
    client: DbClient | DrizzleTransaction,
  ): Promise<Map<string, { id: string; slug: string; name: string }[]>> {
    if (placeIds.length === 0) {
      return new Map();
    }

    const rows = await client
      .select({
        placeId: court.placeId,
        sportId: sport.id,
        slug: sport.slug,
        name: sport.name,
      })
      .from(court)
      .innerJoin(sport, eq(court.sportId, sport.id))
      .where(inArray(court.placeId, placeIds));

    const grouped = new Map<
      string,
      { id: string; slug: string; name: string }[]
    >();
    for (const row of rows) {
      const existing = grouped.get(row.placeId) ?? [];
      if (!existing.find((s) => s.id === row.sportId)) {
        existing.push({ id: row.sportId, slug: row.slug, name: row.name });
      }
      grouped.set(row.placeId, existing);
    }

    return grouped;
  }

  private async getCourtCountsByPlaceIds(
    placeIds: string[],
    sportId: string | undefined,
    client: DbClient | DrizzleTransaction,
  ): Promise<Map<string, number>> {
    if (placeIds.length === 0) {
      return new Map();
    }

    const conditions = [inArray(court.placeId, placeIds)];
    if (sportId) {
      conditions.push(eq(court.sportId, sportId));
    }

    const rows = await client
      .select({
        placeId: court.placeId,
        count: count(),
      })
      .from(court)
      .where(and(...conditions))
      .groupBy(court.placeId);

    return new Map(rows.map((row) => [row.placeId, row.count]));
  }

  private async getLowestPriceByPlaceIds(
    placeIds: string[],
    sportId: string | undefined,
    client: DbClient | DrizzleTransaction,
  ): Promise<Map<string, { priceCents: number; currency: string }>> {
    if (placeIds.length === 0) {
      return new Map();
    }

    const conditions = [inArray(court.placeId, placeIds)];
    if (sportId) {
      conditions.push(eq(court.sportId, sportId));
    }

    const rows = await client
      .select({
        placeId: court.placeId,
        hourlyRateCents: courtRateRule.hourlyRateCents,
        currency: courtRateRule.currency,
      })
      .from(courtRateRule)
      .innerJoin(court, eq(courtRateRule.courtId, court.id))
      .where(and(...conditions));

    const prices = new Map<string, { priceCents: number; currency: string }>();
    for (const row of rows) {
      const existing = prices.get(row.placeId);
      if (!existing || row.hourlyRateCents < existing.priceCents) {
        prices.set(row.placeId, {
          priceCents: row.hourlyRateCents,
          currency: row.currency,
        });
      }
    }

    return prices;
  }
}
