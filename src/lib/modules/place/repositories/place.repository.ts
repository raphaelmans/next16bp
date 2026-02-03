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
  organizationProfile,
  organizationReservationPolicy,
  type PlaceContactDetailRecord,
  type PlaceRecord,
  place,
  placeAmenity,
  placeContactDetail,
  placePhoto,
  placeVerification,
  sport,
} from "@/lib/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/lib/shared/infra/db/types";
import type { RequestContext } from "@/lib/shared/kernel/context";

export interface PlaceWithDetails {
  place: PlaceRecord;
  contactDetail: typeof placeContactDetail.$inferSelect | null;
  reservationPolicy: typeof organizationReservationPolicy.$inferSelect | null;
  verification: typeof placeVerification.$inferSelect | null;
  photos: (typeof placePhoto.$inferSelect)[];
  amenities: (typeof placeAmenity.$inferSelect)[];
  organizationLogoUrl?: string | null;
}

export interface PlaceListItem {
  place: PlaceRecord;
  coverImageUrl?: string | null;
  organizationLogoUrl?: string | null;
  sports: { id: string; slug: string; name: string }[];
  courtCount: number;
  lowestPriceCents?: number;
  currency?: string;
  verificationStatus?: typeof placeVerification.$inferSelect.status | null;
  reservationsEnabled?: boolean | null;
}

export interface PlaceSummaryItem {
  place: {
    id: string;
    slug?: string | null;
    name: string;
    address: string;
    city: string;
    latitude: string | null;
    longitude: string | null;
    placeType?: "CURATED" | "RESERVABLE";
    featuredRank?: number | null;
  };
}

export interface PlaceCardMediaItem {
  placeId: string;
  coverImageUrl: string | null;
  organizationLogoUrl: string | null;
}

export interface PlaceCardMetaItem {
  placeId: string;
  sports: { id: string; slug: string; name: string }[];
  courtCount: number;
  lowestPriceCents: number | null;
  currency: string | null;
  verificationStatus?: typeof placeVerification.$inferSelect.status | null;
  reservationsEnabled?: boolean | null;
}

export interface PaginatedPlaces {
  items: PlaceListItem[];
  total: number;
}

export interface IPlaceRepository {
  findById(id: string, ctx?: RequestContext): Promise<PlaceRecord | null>;
  findByIds(ids: string[], ctx?: RequestContext): Promise<PlaceRecord[]>;
  findBySlug(slug: string, ctx?: RequestContext): Promise<PlaceRecord | null>;
  findByIdForUpdate(
    id: string,
    ctx: RequestContext,
  ): Promise<PlaceRecord | null>;
  findWithDetails(
    id: string,
    ctx?: RequestContext,
  ): Promise<PlaceWithDetails | null>;
  findWithDetailsBySlug(
    slug: string,
    ctx?: RequestContext,
  ): Promise<PlaceWithDetails | null>;
  findByOrganizationId(
    organizationId: string,
    ctx?: RequestContext,
  ): Promise<PlaceRecord[]>;
  findActiveByOrganizationId(
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
      verificationTier?:
        | "verified_reservable"
        | "curated"
        | "unverified_reservable";
      featuredOnly?: boolean;
      limit: number;
      offset: number;
    },
    ctx?: RequestContext,
  ): Promise<PaginatedPlaces>;
  listSummary(
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
      featuredOnly?: boolean;
      limit: number;
      offset: number;
    },
    ctx?: RequestContext,
  ): Promise<{ items: PlaceSummaryItem[]; total: number }>;
  listCardMediaByPlaceIds(
    placeIds: string[],
    ctx?: RequestContext,
  ): Promise<PlaceCardMediaItem[]>;
  listCardMetaByPlaceIds(
    placeIds: string[],
    sportId?: string,
    ctx?: RequestContext,
  ): Promise<PlaceCardMetaItem[]>;
  listAmenities(ctx?: RequestContext): Promise<string[]>;
  deleteAmenitiesByPlaceId(
    placeId: string,
    ctx?: RequestContext,
  ): Promise<void>;
  createAmenities(
    placeId: string,
    names: string[],
    ctx?: RequestContext,
  ): Promise<void>;
  replaceAmenitiesByPlaceId(
    placeId: string,
    names: string[],
    ctx?: RequestContext,
  ): Promise<void>;
  create(data: InsertPlace, ctx?: RequestContext): Promise<PlaceRecord>;
  update(
    id: string,
    data: Partial<InsertPlace>,
    ctx?: RequestContext,
  ): Promise<PlaceRecord>;
  delete(id: string, ctx?: RequestContext): Promise<void>;
  upsertContactDetail(
    data: InsertPlaceContactDetail,
    ctx?: RequestContext,
  ): Promise<PlaceContactDetailRecord>;
  getPublicStats(): Promise<{
    totalPlaces: number;
    totalCourts: number;
    totalCities: number;
    totalVerifiedVenues: number;
  }>;
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

  async findByIds(ids: string[], ctx?: RequestContext): Promise<PlaceRecord[]> {
    if (ids.length === 0) return [];
    const client = this.getClient(ctx);
    return client.select().from(place).where(inArray(place.id, ids));
  }

  async findBySlug(
    slug: string,
    ctx?: RequestContext,
  ): Promise<PlaceRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(place)
      .where(eq(place.slug, slug))
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

    let organizationLogoUrl: string | null = null;
    if (placeRecord.organizationId) {
      const profileResult = await client
        .select({ logoUrl: organizationProfile.logoUrl })
        .from(organizationProfile)
        .where(
          eq(organizationProfile.organizationId, placeRecord.organizationId),
        )
        .limit(1);
      organizationLogoUrl = profileResult[0]?.logoUrl ?? null;
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
      verification,
      photos,
      amenities,
      organizationLogoUrl,
    };
  }

  async findWithDetailsBySlug(
    slug: string,
    ctx?: RequestContext,
  ): Promise<PlaceWithDetails | null> {
    const placeRecord = await this.findBySlug(slug, ctx);
    if (!placeRecord) {
      return null;
    }

    return this.findWithDetails(placeRecord.id, ctx);
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

  async findActiveByOrganizationId(
    organizationId: string,
    ctx?: RequestContext,
  ): Promise<PlaceRecord[]> {
    const client = this.getClient(ctx);
    const featuredBucket = sql<number>`case
      when ${place.featuredRank} = 0 then 1
      else 0
    end`;

    return client
      .select()
      .from(place)
      .where(
        and(eq(place.organizationId, organizationId), eq(place.isActive, true)),
      )
      .orderBy(
        featuredBucket,
        asc(place.featuredRank),
        asc(place.name),
        asc(place.id),
      );
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
      featuredOnly?: boolean;
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
    const featuredBucket = sql<number>`case
      when ${place.featuredRank} = 0 then 1
      else 0
    end`;
    const featuredOrder = [
      featuredBucket,
      asc(place.featuredRank),
      verificationRank,
      asc(place.name),
      asc(place.id),
    ] as const;

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

    if (filters.featuredOnly) {
      conditions.push(sql`${place.featuredRank} > 0`);
    }

    const baseCondition = and(...conditions);

    if (filters.sportId) {
      if (amenitiesFilter.length > 0) {
        const amenitiesCount = amenitiesFilter.length;
        const countResult = await client.select({ count: count() }).from(
          client
            .select({ placeId: place.id })
            .from(place)
            .leftJoin(
              placeVerification,
              eq(placeVerification.placeId, place.id),
            )
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
            )
            .as("place_ids"),
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
          .orderBy(...featuredOrder)
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

        const [
          sportsByPlace,
          courtCounts,
          lowestPrices,
          coverImageUrls,
          organizationLogos,
          verificationRows,
        ] = await Promise.all([
          this.getSportsByPlaceIds(placeIds, client),
          this.getCourtCountsByPlaceIds(placeIds, filters.sportId, client),
          this.getLowestPriceByPlaceIds(placeIds, filters.sportId, client),
          this.getCoverImageByPlaceIds(placeIds, client),
          this.getOrganizationLogoByOrganizationIds(placeIds, client),
          placeIds.length
            ? client
                .select({
                  placeId: placeVerification.placeId,
                  status: placeVerification.status,
                  reservationsEnabled: placeVerification.reservationsEnabled,
                })
                .from(placeVerification)
                .where(inArray(placeVerification.placeId, placeIds))
            : Promise.resolve([]),
        ]);

        const verificationByPlaceId = new Map(
          verificationRows.map((row) => [row.placeId, row]),
        );
        return {
          items: orderedPlaces.map((placeRecord) => {
            const lowestPrice = lowestPrices.get(placeRecord.id);
            const verification = verificationByPlaceId.get(placeRecord.id);
            return {
              place: placeRecord,
              coverImageUrl: coverImageUrls.get(placeRecord.id) ?? null,
              organizationLogoUrl:
                organizationLogos.get(placeRecord.id) ?? null,
              sports: sportsByPlace.get(placeRecord.id) ?? [],
              courtCount: courtCounts.get(placeRecord.id) ?? 0,
              lowestPriceCents: lowestPrice?.priceCents,
              currency: lowestPrice?.currency,
              verificationStatus: verification?.status ?? null,
              reservationsEnabled: verification?.reservationsEnabled ?? null,
            };
          }),
          total: countResult[0]?.count ?? 0,
        };
      }

      const countResult = await client
        .select({ count: count() })
        .from(place)
        .leftJoin(placeVerification, eq(placeVerification.placeId, place.id))
        .innerJoin(court, eq(court.placeId, place.id))
        .where(and(baseCondition, eq(court.sportId, filters.sportId)));

      const placeRows = await client
        .select({ place })
        .from(place)
        .leftJoin(placeVerification, eq(placeVerification.placeId, place.id))
        .innerJoin(court, eq(court.placeId, place.id))
        .where(and(baseCondition, eq(court.sportId, filters.sportId)))
        .orderBy(...featuredOrder)
        .limit(filters.limit)
        .offset(filters.offset);

      const uniquePlaces = Array.from(
        new Map(placeRows.map((row) => [row.place.id, row.place])).values(),
      );
      const placeIds = uniquePlaces.map((placeRecord) => placeRecord.id);

      const [
        sportsByPlace,
        courtCounts,
        lowestPrices,
        coverImageUrls,
        organizationLogos,
        verificationRows,
      ] = await Promise.all([
        this.getSportsByPlaceIds(placeIds, client),
        this.getCourtCountsByPlaceIds(placeIds, filters.sportId, client),
        this.getLowestPriceByPlaceIds(placeIds, filters.sportId, client),
        this.getCoverImageByPlaceIds(placeIds, client),
        this.getOrganizationLogoByOrganizationIds(placeIds, client),
        placeIds.length
          ? client
              .select({
                placeId: placeVerification.placeId,
                status: placeVerification.status,
                reservationsEnabled: placeVerification.reservationsEnabled,
              })
              .from(placeVerification)
              .where(inArray(placeVerification.placeId, placeIds))
          : Promise.resolve([]),
      ]);

      const verificationByPlaceId = new Map(
        verificationRows.map((row) => [row.placeId, row]),
      );

      return {
        items: uniquePlaces.map((placeRecord) => {
          const lowestPrice = lowestPrices.get(placeRecord.id);
          const verification = verificationByPlaceId.get(placeRecord.id);
          return {
            place: placeRecord,
            coverImageUrl: coverImageUrls.get(placeRecord.id) ?? null,
            organizationLogoUrl: organizationLogos.get(placeRecord.id) ?? null,
            sports: sportsByPlace.get(placeRecord.id) ?? [],
            courtCount: courtCounts.get(placeRecord.id) ?? 0,
            lowestPriceCents: lowestPrice?.priceCents,
            currency: lowestPrice?.currency,
            verificationStatus: verification?.status ?? null,
            reservationsEnabled: verification?.reservationsEnabled ?? null,
          };
        }),
        total: countResult[0]?.count ?? 0,
      };
    }

    let placeRecords: PlaceRecord[] = [];
    let total = 0;

    if (amenitiesFilter.length > 0) {
      const amenitiesCount = amenitiesFilter.length;
      const countResult = await client.select({ count: count() }).from(
        client
          .select({ placeId: place.id })
          .from(place)
          .leftJoin(placeVerification, eq(placeVerification.placeId, place.id))
          .innerJoin(placeAmenity, eq(placeAmenity.placeId, place.id))
          .where(
            and(baseCondition, inArray(placeAmenity.name, amenitiesFilter)),
          )
          .groupBy(place.id)
          .having(sql`count(distinct ${placeAmenity.name}) = ${amenitiesCount}`)
          .as("place_ids"),
      );

      const pageRows = await client
        .select({ placeId: place.id })
        .from(place)
        .leftJoin(placeVerification, eq(placeVerification.placeId, place.id))
        .innerJoin(placeAmenity, eq(placeAmenity.placeId, place.id))
        .where(and(baseCondition, inArray(placeAmenity.name, amenitiesFilter)))
        .groupBy(place.id)
        .having(sql`count(distinct ${placeAmenity.name}) = ${amenitiesCount}`)
        .orderBy(...featuredOrder)
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
      total = countResult[0]?.count ?? 0;
    } else {
      const countResult = await client
        .select({ count: count() })
        .from(place)
        .leftJoin(placeVerification, eq(placeVerification.placeId, place.id))
        .where(baseCondition);

      const placeRows = await client
        .select({ place })
        .from(place)
        .leftJoin(placeVerification, eq(placeVerification.placeId, place.id))
        .where(baseCondition)
        .orderBy(...featuredOrder)
        .limit(filters.limit)
        .offset(filters.offset);

      placeRecords = placeRows.map((row) => row.place);

      total = countResult[0]?.count ?? 0;
    }

    const placeIds = placeRecords.map((placeRecord) => placeRecord.id);

    const [
      sportsByPlace,
      courtCounts,
      lowestPrices,
      coverImageUrls,
      organizationLogos,
      verificationRows,
    ] = await Promise.all([
      this.getSportsByPlaceIds(placeIds, client),
      this.getCourtCountsByPlaceIds(placeIds, undefined, client),
      this.getLowestPriceByPlaceIds(placeIds, undefined, client),
      this.getCoverImageByPlaceIds(placeIds, client),
      this.getOrganizationLogoByOrganizationIds(placeIds, client),
      placeIds.length
        ? client
            .select({
              placeId: placeVerification.placeId,
              status: placeVerification.status,
              reservationsEnabled: placeVerification.reservationsEnabled,
            })
            .from(placeVerification)
            .where(inArray(placeVerification.placeId, placeIds))
        : Promise.resolve([]),
    ]);

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
          organizationLogoUrl: organizationLogos.get(placeRecord.id) ?? null,
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

  async listSummary(
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
      featuredOnly?: boolean;
      limit: number;
      offset: number;
    },
    ctx?: RequestContext,
  ): Promise<{ items: PlaceSummaryItem[]; total: number }> {
    const client = this.getClient(ctx);
    const { placeRecords, total } = await this.listBaseRecords(filters, client);

    return {
      items: placeRecords.map((placeRecord) => ({
        place: {
          id: placeRecord.id,
          slug: placeRecord.slug,
          name: placeRecord.name,
          address: placeRecord.address,
          city: placeRecord.city,
          latitude: placeRecord.latitude ?? null,
          longitude: placeRecord.longitude ?? null,
          placeType: placeRecord.placeType,
          featuredRank: placeRecord.featuredRank ?? null,
        },
      })),
      total,
    };
  }

  async listCardMediaByPlaceIds(
    placeIds: string[],
    ctx?: RequestContext,
  ): Promise<PlaceCardMediaItem[]> {
    if (placeIds.length === 0) return [];
    const client = this.getClient(ctx);
    const [coverImageUrls, organizationLogos] = await Promise.all([
      this.getCoverImageByPlaceIds(placeIds, client),
      this.getOrganizationLogoByOrganizationIds(placeIds, client),
    ]);

    return placeIds.map((placeId) => ({
      placeId,
      coverImageUrl: coverImageUrls.get(placeId) ?? null,
      organizationLogoUrl: organizationLogos.get(placeId) ?? null,
    }));
  }

  async listCardMetaByPlaceIds(
    placeIds: string[],
    sportId?: string,
    ctx?: RequestContext,
  ): Promise<PlaceCardMetaItem[]> {
    if (placeIds.length === 0) return [];
    const client = this.getClient(ctx);
    const [sportsByPlace, courtCounts, lowestPrices, verificationRows] =
      await Promise.all([
        this.getSportsByPlaceIds(placeIds, client),
        this.getCourtCountsByPlaceIds(placeIds, sportId, client),
        this.getLowestPriceByPlaceIds(placeIds, sportId, client),
        client
          .select({
            placeId: placeVerification.placeId,
            status: placeVerification.status,
            reservationsEnabled: placeVerification.reservationsEnabled,
          })
          .from(placeVerification)
          .where(inArray(placeVerification.placeId, placeIds)),
      ]);

    const verificationByPlaceId = new Map(
      verificationRows.map((row) => [row.placeId, row]),
    );

    return placeIds.map((placeId) => {
      const lowestPrice = lowestPrices.get(placeId);
      const verification = verificationByPlaceId.get(placeId);
      return {
        placeId,
        sports: sportsByPlace.get(placeId) ?? [],
        courtCount: courtCounts.get(placeId) ?? 0,
        lowestPriceCents: lowestPrice?.priceCents ?? null,
        currency: lowestPrice?.currency ?? null,
        verificationStatus: verification?.status ?? null,
        reservationsEnabled: verification?.reservationsEnabled ?? null,
      };
    });
  }

  private async listBaseRecords(
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
      featuredOnly?: boolean;
      limit: number;
      offset: number;
    },
    client: DbClient | DrizzleTransaction,
  ): Promise<{ placeRecords: PlaceRecord[]; total: number }> {
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
    const featuredBucket = sql<number>`case
      when ${place.featuredRank} = 0 then 1
      else 0
    end`;
    const featuredOrder = [
      featuredBucket,
      asc(place.featuredRank),
      verificationRank,
      asc(place.name),
      asc(place.id),
    ] as const;

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

    if (filters.featuredOnly) {
      conditions.push(sql`${place.featuredRank} > 0`);
    }

    const baseCondition = and(...conditions);

    if (filters.sportId) {
      if (amenitiesFilter.length > 0) {
        const amenitiesCount = amenitiesFilter.length;
        const countResult = await client.select({ count: count() }).from(
          client
            .select({ placeId: place.id })
            .from(place)
            .leftJoin(
              placeVerification,
              eq(placeVerification.placeId, place.id),
            )
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
            )
            .as("place_ids"),
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
          .orderBy(...featuredOrder)
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

        return {
          placeRecords: orderedPlaces,
          total: countResult[0]?.count ?? 0,
        };
      }

      const countResult = await client
        .select({ count: count() })
        .from(place)
        .leftJoin(placeVerification, eq(placeVerification.placeId, place.id))
        .innerJoin(court, eq(court.placeId, place.id))
        .where(and(baseCondition, eq(court.sportId, filters.sportId)));

      const placeRows = await client
        .select({ place })
        .from(place)
        .leftJoin(placeVerification, eq(placeVerification.placeId, place.id))
        .innerJoin(court, eq(court.placeId, place.id))
        .where(and(baseCondition, eq(court.sportId, filters.sportId)))
        .orderBy(...featuredOrder)
        .limit(filters.limit)
        .offset(filters.offset);

      const uniquePlaces = Array.from(
        new Map(placeRows.map((row) => [row.place.id, row.place])).values(),
      );

      return {
        placeRecords: uniquePlaces,
        total: countResult[0]?.count ?? 0,
      };
    }

    let placeRecords: PlaceRecord[] = [];
    let total = 0;

    if (amenitiesFilter.length > 0) {
      const amenitiesCount = amenitiesFilter.length;
      const countResult = await client.select({ count: count() }).from(
        client
          .select({ placeId: place.id })
          .from(place)
          .leftJoin(placeVerification, eq(placeVerification.placeId, place.id))
          .innerJoin(placeAmenity, eq(placeAmenity.placeId, place.id))
          .where(
            and(baseCondition, inArray(placeAmenity.name, amenitiesFilter)),
          )
          .groupBy(place.id)
          .having(sql`count(distinct ${placeAmenity.name}) = ${amenitiesCount}`)
          .as("place_ids"),
      );

      const pageRows = await client
        .select({ placeId: place.id })
        .from(place)
        .leftJoin(placeVerification, eq(placeVerification.placeId, place.id))
        .innerJoin(placeAmenity, eq(placeAmenity.placeId, place.id))
        .where(and(baseCondition, inArray(placeAmenity.name, amenitiesFilter)))
        .groupBy(place.id)
        .having(sql`count(distinct ${placeAmenity.name}) = ${amenitiesCount}`)
        .orderBy(...featuredOrder)
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
      total = countResult[0]?.count ?? 0;
    } else {
      const countResult = await client
        .select({ count: count() })
        .from(place)
        .leftJoin(placeVerification, eq(placeVerification.placeId, place.id))
        .where(baseCondition);

      const placeRows = await client
        .select({ place })
        .from(place)
        .leftJoin(placeVerification, eq(placeVerification.placeId, place.id))
        .where(baseCondition)
        .orderBy(...featuredOrder)
        .limit(filters.limit)
        .offset(filters.offset);

      placeRecords = placeRows.map((row) => row.place);

      total = countResult[0]?.count ?? 0;
    }

    return { placeRecords, total };
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

  async deleteAmenitiesByPlaceId(
    placeId: string,
    ctx?: RequestContext,
  ): Promise<void> {
    const client = this.getClient(ctx);
    await client.delete(placeAmenity).where(eq(placeAmenity.placeId, placeId));
  }

  async createAmenities(
    placeId: string,
    names: string[],
    ctx?: RequestContext,
  ): Promise<void> {
    const client = this.getClient(ctx);
    const normalized = Array.from(
      new Set(
        names.map((name) => name.trim()).filter((name) => name.length > 0),
      ),
    );

    if (normalized.length === 0) return;

    await client
      .insert(placeAmenity)
      .values(normalized.map((name) => ({ placeId, name })))
      .onConflictDoNothing();
  }

  async replaceAmenitiesByPlaceId(
    placeId: string,
    names: string[],
    ctx?: RequestContext,
  ): Promise<void> {
    await this.deleteAmenitiesByPlaceId(placeId, ctx);
    await this.createAmenities(placeId, names, ctx);
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

  async delete(id: string, ctx?: RequestContext): Promise<void> {
    const client = this.getClient(ctx);
    await client.delete(place).where(eq(place.id, id));
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
          phoneNumber: data.phoneNumber ?? null,
          viberInfo: data.viberInfo ?? null,
          otherContactInfo: data.otherContactInfo ?? null,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  }

  async getPublicStats(): Promise<{
    totalPlaces: number;
    totalCourts: number;
    totalCities: number;
    totalVerifiedVenues: number;
  }> {
    const [places, courts, cities, verified] = await Promise.all([
      this.db
        .select({ count: count() })
        .from(place)
        .where(eq(place.isActive, true)),
      this.db
        .select({ count: count() })
        .from(court)
        .where(eq(court.isActive, true)),
      this.db
        .selectDistinct({ city: place.city })
        .from(place)
        .where(eq(place.isActive, true)),
      this.db
        .select({ count: count() })
        .from(placeVerification)
        .innerJoin(place, eq(placeVerification.placeId, place.id))
        .where(
          and(
            eq(placeVerification.status, "VERIFIED"),
            eq(place.isActive, true),
          ),
        ),
    ]);
    return {
      totalPlaces: places[0]?.count ?? 0,
      totalCourts: courts[0]?.count ?? 0,
      totalCities: cities.length,
      totalVerifiedVenues: verified[0]?.count ?? 0,
    };
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
      if (!row.placeId) {
        continue;
      }
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

    const normalized = rows.flatMap((row) =>
      row.placeId ? ([[row.placeId, row.count]] as const) : [],
    );
    return new Map(normalized);
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
      if (!row.placeId) {
        continue;
      }
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

  private async getOrganizationLogoByOrganizationIds(
    placeIds: string[],
    client: DbClient | DrizzleTransaction,
  ): Promise<Map<string, string | null>> {
    if (placeIds.length === 0) {
      return new Map();
    }

    const rows = await client
      .select({
        placeId: place.id,
        logoUrl: organizationProfile.logoUrl,
      })
      .from(place)
      .leftJoin(
        organizationProfile,
        eq(organizationProfile.organizationId, place.organizationId),
      )
      .where(inArray(place.id, placeIds));

    return new Map(rows.map((row) => [row.placeId, row.logoUrl ?? null]));
  }
}
