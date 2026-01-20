import {
  and,
  asc,
  count,
  eq,
  ilike,
  inArray,
  isNull,
  ne,
  or,
  sql,
} from "drizzle-orm";
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
  placeVerification,
  sport,
} from "@/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/shared/infra/db/types";
import type { RequestContext } from "@/shared/kernel/context";

export interface PlaceWithDetails {
  place: PlaceRecord;
  contactDetail: typeof placeContactDetail.$inferSelect | null;
  reservationPolicy: typeof organizationReservationPolicy.$inferSelect | null;
  verification: typeof placeVerification.$inferSelect | null;
  photos: (typeof placePhoto.$inferSelect)[];
  amenities: (typeof placeAmenity.$inferSelect)[];
}

export interface PlaceListItem {
  place: PlaceRecord;
  coverImageUrl?: string | null;
  sports: { id: string; slug: string; name: string }[];
  courtCount: number;
  lowestPriceCents?: number;
  currency?: string;
  verificationStatus?: typeof placeVerification.$inferSelect.status | null;
  reservationsEnabled?: boolean | null;
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
  findByOrganizationIdWithVerification(
    organizationId: string,
    ctx?: RequestContext,
  ): Promise<
    (PlaceRecord & {
      verification: typeof placeVerification.$inferSelect | null;
    })[]
  >;
  list(
    filters: {
      q?: string;
      province?: string;
      city?: string;
      sportId?: string;
      amenities?: string[];
      limit: number;
      offset: number;
    },
    ctx?: RequestContext,
  ): Promise<PaginatedPlaces>;
  listAmenities(ctx?: RequestContext): Promise<string[]>;
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

    const verificationResult = await client
      .select()
      .from(placeVerification)
      .where(eq(placeVerification.placeId, id))
      .limit(1);
    const verification = verificationResult[0] ?? null;

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
      verification,
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

  async findByOrganizationIdWithVerification(
    organizationId: string,
    ctx?: RequestContext,
  ): Promise<
    (PlaceRecord & {
      verification: typeof placeVerification.$inferSelect | null;
    })[]
  > {
    const client = this.getClient(ctx);
    const result = await client
      .select({
        place,
        verification: placeVerification,
      })
      .from(place)
      .leftJoin(placeVerification, eq(placeVerification.placeId, place.id))
      .where(eq(place.organizationId, organizationId));

    return result.map((row) => ({
      ...row.place,
      verification: row.verification ?? null,
    }));
  }

  async list(
    filters: {
      q?: string;
      province?: string;
      city?: string;
      sportId?: string;
      amenities?: string[];
      verificationTier?:
        | "verified_reservable"
        | "curated"
        | "unverified_reservable";
      limit: number;
      offset: number;
    },
    ctx?: RequestContext,
  ): Promise<PaginatedPlaces> {
    const client = this.getClient(ctx);
    const conditions = [eq(place.isActive, true)];

    const searchValue = filters.q?.trim();
    const searchPattern = searchValue ? `%${searchValue}%` : undefined;
    const amenitiesFilter = Array.from(
      new Set(
        (filters.amenities ?? [])
          .map((amenity) => amenity.trim())
          .filter((amenity) => amenity.length > 0),
      ),
    );
    const verificationTier = filters.verificationTier;
    const verificationJoin = placeVerification;
    const verificationRank = sql<number>`case
      when ${place.placeType} = 'RESERVABLE'
        and ${verificationJoin.status} = 'VERIFIED'
        then 0
      when ${place.placeType} = 'CURATED' then 1
      else 2
    end`;

    if (filters.province) {
      conditions.push(ilike(place.province, filters.province));
    }

    if (filters.city) {
      conditions.push(ilike(place.city, filters.city));
    }

    if (searchPattern) {
      const searchCondition = or(
        ilike(place.name, searchPattern),
        ilike(place.address, searchPattern),
        ilike(place.city, searchPattern),
        ilike(place.province, searchPattern),
      );

      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    if (verificationTier === "verified_reservable") {
      conditions.push(eq(place.placeType, "RESERVABLE"));
      conditions.push(eq(verificationJoin.status, "VERIFIED"));
    }

    if (verificationTier === "curated") {
      conditions.push(eq(place.placeType, "CURATED"));
    }

    if (verificationTier === "unverified_reservable") {
      conditions.push(eq(place.placeType, "RESERVABLE"));
      const unverifiedCondition = or(
        isNull(verificationJoin.status),
        ne(verificationJoin.status, "VERIFIED"),
      );
      if (unverifiedCondition) {
        conditions.push(unverifiedCondition);
      }
    }

    const baseCondition = and(...conditions);

    if (filters.sportId) {
      if (amenitiesFilter.length > 0) {
        const amenitiesCount = amenitiesFilter.length;
        const countResult = await client
          .select({ count: count() })
          .from(place)
          .leftJoin(placeVerification, eq(placeVerification.placeId, place.id))
          .innerJoin(court, eq(court.placeId, place.id))
          .innerJoin(placeAmenity, eq(placeAmenity.placeId, place.id))
          .where(
            and(
              baseCondition,
              eq(court.sportId, filters.sportId),
              inArray(placeAmenity.name, amenitiesFilter),
            ),
          )
          .groupBy(place.id)
          .having(
            sql`count(distinct ${placeAmenity.name}) = ${amenitiesCount}`,
          );

        const pageRows = await client
          .select({ placeId: place.id })
          .from(place)
          .leftJoin(placeVerification, eq(placeVerification.placeId, place.id))
          .innerJoin(court, eq(court.placeId, place.id))
          .innerJoin(placeAmenity, eq(placeAmenity.placeId, place.id))
          .where(
            and(
              baseCondition,
              eq(court.sportId, filters.sportId),
              inArray(placeAmenity.name, amenitiesFilter),
            ),
          )
          .groupBy(place.id)
          .having(sql`count(distinct ${placeAmenity.name}) = ${amenitiesCount}`)
          .orderBy(verificationRank, asc(place.name), asc(place.id))
          .limit(filters.limit)
          .offset(filters.offset);

        const placeIds = pageRows.map((row) => row.placeId);
        const placeRecords = placeIds.length
          ? await client.select().from(place).where(inArray(place.id, placeIds))
          : [];
        const placeById = new Map(
          placeRecords.map((record) => [record.id, record]),
        );
        const orderedPlaces = placeIds
          .map((placeId) => placeById.get(placeId))
          .filter((record): record is PlaceRecord => Boolean(record));

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

        const coverImageUrls = await this.getCoverImageByPlaceIds(
          placeIds,
          client,
        );

        const verificationRows = await client
          .select({
            placeId: placeVerification.placeId,
            status: placeVerification.status,
            reservationsEnabled: placeVerification.reservationsEnabled,
          })
          .from(placeVerification)
          .where(inArray(placeVerification.placeId, placeIds));

        const verificationByPlaceId = new Map(
          verificationRows.map((row) => [row.placeId, row]),
        );
        const totalMatches = countResult.reduce(
          (sum, row) => sum + (row.count ?? 0),
          0,
        );

        return {
          items: orderedPlaces.map((placeRecord) => {
            const lowestPrice = lowestPrices.get(placeRecord.id);
            const verification = verificationByPlaceId.get(placeRecord.id);
            return {
              place: placeRecord,
              coverImageUrl: coverImageUrls.get(placeRecord.id) ?? null,
              sports: sportsByPlace.get(placeRecord.id) ?? [],
              courtCount: courtCounts.get(placeRecord.id) ?? 0,
              lowestPriceCents: lowestPrice?.priceCents,
              currency: lowestPrice?.currency,
              verificationStatus: verification?.status ?? null,
              reservationsEnabled: verification?.reservationsEnabled ?? null,
            };
          }),
          total: totalMatches,
        };
      }

      const countResult = await client
        .select({ count: count() })
        .from(place)
        .leftJoin(placeVerification, eq(placeVerification.placeId, place.id))
        .innerJoin(court, eq(court.placeId, place.id))
        .where(and(baseCondition, eq(court.sportId, filters.sportId)))
        .groupBy(place.id);

      const placeRows = await client
        .select({ place })
        .from(place)
        .leftJoin(placeVerification, eq(placeVerification.placeId, place.id))
        .innerJoin(court, eq(court.placeId, place.id))
        .where(and(baseCondition, eq(court.sportId, filters.sportId)))
        .orderBy(verificationRank, asc(place.name), asc(place.id))
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

      const coverImageUrls = await this.getCoverImageByPlaceIds(
        placeIds,
        client,
      );

      const verificationRows = await client
        .select({
          placeId: placeVerification.placeId,
          status: placeVerification.status,
          reservationsEnabled: placeVerification.reservationsEnabled,
        })
        .from(placeVerification)
        .where(inArray(placeVerification.placeId, placeIds));

      const verificationByPlaceId = new Map(
        verificationRows.map((row) => [row.placeId, row]),
      );

      const totalMatches = countResult.reduce(
        (sum, row) => sum + (row.count ?? 0),
        0,
      );

      return {
        items: uniquePlaces.map((placeRecord) => {
          const lowestPrice = lowestPrices.get(placeRecord.id);
          const verification = verificationByPlaceId.get(placeRecord.id);
          return {
            place: placeRecord,
            coverImageUrl: coverImageUrls.get(placeRecord.id) ?? null,
            sports: sportsByPlace.get(placeRecord.id) ?? [],
            courtCount: courtCounts.get(placeRecord.id) ?? 0,
            lowestPriceCents: lowestPrice?.priceCents,
            currency: lowestPrice?.currency,
            verificationStatus: verification?.status ?? null,
            reservationsEnabled: verification?.reservationsEnabled ?? null,
          };
        }),
        total: totalMatches,
      };
    }

    let placeRecords: PlaceRecord[] = [];
    let total = 0;

    if (amenitiesFilter.length > 0) {
      const amenitiesCount = amenitiesFilter.length;
      const countResult = await client
        .select({ count: count() })
        .from(place)
        .leftJoin(placeVerification, eq(placeVerification.placeId, place.id))
        .innerJoin(placeAmenity, eq(placeAmenity.placeId, place.id))
        .where(and(baseCondition, inArray(placeAmenity.name, amenitiesFilter)))
        .groupBy(place.id)
        .having(sql`count(distinct ${placeAmenity.name}) = ${amenitiesCount}`);

      const pageRows = await client
        .select({ placeId: place.id })
        .from(place)
        .leftJoin(placeVerification, eq(placeVerification.placeId, place.id))
        .innerJoin(placeAmenity, eq(placeAmenity.placeId, place.id))
        .where(and(baseCondition, inArray(placeAmenity.name, amenitiesFilter)))
        .groupBy(place.id)
        .having(sql`count(distinct ${placeAmenity.name}) = ${amenitiesCount}`)
        .orderBy(verificationRank, asc(place.name), asc(place.id))
        .limit(filters.limit)
        .offset(filters.offset);

      const placeIds = pageRows.map((row) => row.placeId);
      placeRecords = placeIds.length
        ? await client.select().from(place).where(inArray(place.id, placeIds))
        : [];
      const placeById = new Map(
        placeRecords.map((record) => [record.id, record]),
      );
      placeRecords = placeIds
        .map((placeId) => placeById.get(placeId))
        .filter((record): record is PlaceRecord => Boolean(record));
      total = countResult.reduce((sum, row) => sum + (row.count ?? 0), 0);
    } else {
      const countResult = await client
        .select({ count: count() })
        .from(place)
        .leftJoin(placeVerification, eq(placeVerification.placeId, place.id))
        .where(baseCondition)
        .groupBy(place.id);

      const placeRows = await client
        .select({ place })
        .from(place)
        .leftJoin(placeVerification, eq(placeVerification.placeId, place.id))
        .where(baseCondition)
        .orderBy(verificationRank, asc(place.name), asc(place.id))
        .limit(filters.limit)
        .offset(filters.offset);

      placeRecords = placeRows.map((row) => row.place);

      total = countResult.reduce((sum, row) => sum + (row.count ?? 0), 0);
    }

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
    const coverImageUrls = await this.getCoverImageByPlaceIds(placeIds, client);
    const verificationRows = await client
      .select({
        placeId: placeVerification.placeId,
        status: placeVerification.status,
        reservationsEnabled: placeVerification.reservationsEnabled,
      })
      .from(placeVerification)
      .where(inArray(placeVerification.placeId, placeIds));

    const verificationByPlaceId = new Map(
      verificationRows.map((row) => [row.placeId, row]),
    );

    return {
      items: placeRecords.map((placeRecord) => {
        const lowestPrice = lowestPrices.get(placeRecord.id);
        const verification = verificationByPlaceId.get(placeRecord.id);
        return {
          place: placeRecord,
          coverImageUrl: coverImageUrls.get(placeRecord.id) ?? null,
          sports: sportsByPlace.get(placeRecord.id) ?? [],
          courtCount: courtCounts.get(placeRecord.id) ?? 0,
          lowestPriceCents: lowestPrice?.priceCents,
          currency: lowestPrice?.currency,
          verificationStatus: verification?.status ?? null,
          reservationsEnabled: verification?.reservationsEnabled ?? null,
        };
      }),
      total,
    };
  }

  async listAmenities(ctx?: RequestContext): Promise<string[]> {
    const client = this.getClient(ctx);
    const rows = await client
      .select({ name: placeAmenity.name })
      .from(placeAmenity)
      .groupBy(placeAmenity.name);

    const normalized = rows
      .map((row) => row.name.trim())
      .filter((name) => name.length > 0);

    return Array.from(new Set(normalized)).sort((a, b) => a.localeCompare(b));
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

  private async getCoverImageByPlaceIds(
    placeIds: string[],
    client: DbClient | DrizzleTransaction,
  ): Promise<Map<string, string | null>> {
    if (placeIds.length === 0) {
      return new Map();
    }

    const rows = await client
      .select({
        placeId: placePhoto.placeId,
        url: sql<
          string | null
        >`(array_agg(${placePhoto.url} order by ${placePhoto.displayOrder}))[1]`,
      })
      .from(placePhoto)
      .where(inArray(placePhoto.placeId, placeIds))
      .groupBy(placePhoto.placeId);

    return new Map(rows.map((row) => [row.placeId, row.url]));
  }
}
