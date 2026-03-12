import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  ilike,
  isNotNull,
  isNull,
  lte,
  type SQL,
  sql,
} from "drizzle-orm";
import {
  type CourtRecord,
  court,
  courtSubmission,
  type InsertCourt,
  type InsertPlace,
  type InsertPlaceAmenity,
  type InsertPlaceContactDetail,
  type InsertPlacePhoto,
  organization,
  type PlaceAmenityRecord,
  type PlaceContactDetailRecord,
  type PlacePhotoRecord,
  type PlaceRecord,
  place,
  placeAmenity,
  placeContactDetail,
  placePhoto,
  sport,
} from "@/lib/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/lib/shared/infra/db/types";
import type { RequestContext } from "@/lib/shared/kernel/context";
import type { AdminCourtFiltersDTO } from "../dtos";

/**
 * Admin place list item
 */
export interface AdminPlaceListItem {
  place: PlaceRecord;
  organizationName: string | null;
  submittedByUserId: string | null;
}

export interface AdminPlaceDetails {
  place: PlaceRecord;
  organization: { id: string; name: string; slug: string } | null;
  contactDetail: PlaceContactDetailRecord | null;
  photos: PlacePhotoRecord[];
  amenities: PlaceAmenityRecord[];
  courts: Array<{
    court: CourtRecord;
    sport: { id: string; name: string };
  }>;
}

/**
 * Paginated admin places result
 */
export interface PaginatedAdminPlaces {
  items: AdminPlaceListItem[];
  total: number;
}

/**
 * Created curated place result
 */
export interface CreatedCuratedPlace {
  place: PlaceRecord;
  detail: PlaceContactDetailRecord;
  photos: PlacePhotoRecord[];
  amenities: PlaceAmenityRecord[];
}

export interface IAdminCourtRepository {
  create(data: InsertPlace, ctx?: RequestContext): Promise<PlaceRecord>;
  update(
    id: string,
    data: Partial<InsertPlace>,
    ctx?: RequestContext,
  ): Promise<PlaceRecord>;
  createCuratedDetail(
    data: InsertPlaceContactDetail,
    ctx?: RequestContext,
  ): Promise<PlaceContactDetailRecord>;
  createPhoto(
    data: InsertPlacePhoto,
    ctx?: RequestContext,
  ): Promise<PlacePhotoRecord>;
  createAmenity(
    data: InsertPlaceAmenity,
    ctx?: RequestContext,
  ): Promise<PlaceAmenityRecord>;
  createCourt(data: InsertCourt, ctx?: RequestContext): Promise<CourtRecord>;
  updateCourt(
    id: string,
    data: Partial<InsertCourt>,
    ctx?: RequestContext,
  ): Promise<CourtRecord>;
  deleteCourtById(id: string, ctx?: RequestContext): Promise<void>;
  findCourtsByPlaceId(
    placeId: string,
    ctx?: RequestContext,
  ): Promise<CourtRecord[]>;
  findPhotosByPlaceId(
    placeId: string,
    ctx?: RequestContext,
  ): Promise<PlacePhotoRecord[]>;
  findPhotoById(
    id: string,
    ctx?: RequestContext,
  ): Promise<PlacePhotoRecord | null>;
  deletePhotoById(id: string, ctx?: RequestContext): Promise<void>;
  countPhotosByPlaceId(placeId: string, ctx?: RequestContext): Promise<number>;
  findAll(
    filters: AdminCourtFiltersDTO,
    ctx?: RequestContext,
  ): Promise<PaginatedAdminPlaces>;
  findById(id: string, ctx?: RequestContext): Promise<PlaceRecord | null>;
  findBySlug(slug: string, ctx?: RequestContext): Promise<PlaceRecord | null>;
  findByFeaturedRank(
    featuredRank: number,
    ctx?: RequestContext,
  ): Promise<PlaceRecord | null>;
  findByProvinceAndProvinceRank(
    province: string,
    provinceRank: number,
    ctx?: RequestContext,
  ): Promise<PlaceRecord | null>;
  findByIdForUpdate(
    id: string,
    ctx: RequestContext,
  ): Promise<PlaceRecord | null>;
  findByNameCity(
    name: string,
    city: string,
    ctx?: RequestContext,
  ): Promise<PlaceRecord | null>;
  findDetailsById(
    id: string,
    ctx?: RequestContext,
  ): Promise<AdminPlaceDetails | null>;
  upsertContactDetail(
    data: InsertPlaceContactDetail,
    ctx?: RequestContext,
  ): Promise<PlaceContactDetailRecord>;
  deletePhotosByPlaceId(placeId: string, ctx?: RequestContext): Promise<void>;
  deleteAmenitiesByPlaceId(
    placeId: string,
    ctx?: RequestContext,
  ): Promise<void>;
  deleteCourtsByPlaceId(placeId: string, ctx?: RequestContext): Promise<void>;
  deletePlaceById(placeId: string, ctx?: RequestContext): Promise<void>;
  getStats(
    ctx?: RequestContext,
  ): Promise<{ total: number; reservable: number }>;
}

export class AdminCourtRepository implements IAdminCourtRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
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

  async createCuratedDetail(
    data: InsertPlaceContactDetail,
    ctx?: RequestContext,
  ): Promise<PlaceContactDetailRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .insert(placeContactDetail)
      .values(data)
      .returning();
    return result[0];
  }

  async createPhoto(
    data: InsertPlacePhoto,
    ctx?: RequestContext,
  ): Promise<PlacePhotoRecord> {
    const client = this.getClient(ctx);
    const result = await client.insert(placePhoto).values(data).returning();
    return result[0];
  }

  async createAmenity(
    data: InsertPlaceAmenity,
    ctx?: RequestContext,
  ): Promise<PlaceAmenityRecord> {
    const client = this.getClient(ctx);
    const result = await client.insert(placeAmenity).values(data).returning();
    return result[0];
  }

  async createCourt(
    data: InsertCourt,
    ctx?: RequestContext,
  ): Promise<CourtRecord> {
    const client = this.getClient(ctx);
    const result = await client.insert(court).values(data).returning();
    return result[0];
  }

  async updateCourt(
    id: string,
    data: Partial<InsertCourt>,
    ctx?: RequestContext,
  ): Promise<CourtRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .update(court)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(court.id, id))
      .returning();
    return result[0];
  }

  async deleteCourtById(id: string, ctx?: RequestContext): Promise<void> {
    const client = this.getClient(ctx);
    await client.delete(court).where(eq(court.id, id));
  }

  async findCourtsByPlaceId(
    placeId: string,
    ctx?: RequestContext,
  ): Promise<CourtRecord[]> {
    const client = this.getClient(ctx);
    return client.select().from(court).where(eq(court.placeId, placeId));
  }

  async findPhotosByPlaceId(
    placeId: string,
    ctx?: RequestContext,
  ): Promise<PlacePhotoRecord[]> {
    const client = this.getClient(ctx);
    return client
      .select()
      .from(placePhoto)
      .where(eq(placePhoto.placeId, placeId))
      .orderBy(asc(placePhoto.displayOrder));
  }

  async findPhotoById(
    id: string,
    ctx?: RequestContext,
  ): Promise<PlacePhotoRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(placePhoto)
      .where(eq(placePhoto.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async deletePhotoById(id: string, ctx?: RequestContext): Promise<void> {
    const client = this.getClient(ctx);
    await client.delete(placePhoto).where(eq(placePhoto.id, id));
  }

  async countPhotosByPlaceId(
    placeId: string,
    ctx?: RequestContext,
  ): Promise<number> {
    const client = this.getClient(ctx);
    const result = await client
      .select({ count: count() })
      .from(placePhoto)
      .where(eq(placePhoto.placeId, placeId));
    return result[0]?.count ?? 0;
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

  async deletePhotosByPlaceId(
    placeId: string,
    ctx?: RequestContext,
  ): Promise<void> {
    const client = this.getClient(ctx);
    await client.delete(placePhoto).where(eq(placePhoto.placeId, placeId));
  }

  async deleteAmenitiesByPlaceId(
    placeId: string,
    ctx?: RequestContext,
  ): Promise<void> {
    const client = this.getClient(ctx);
    await client.delete(placeAmenity).where(eq(placeAmenity.placeId, placeId));
  }

  async deleteCourtsByPlaceId(
    placeId: string,
    ctx?: RequestContext,
  ): Promise<void> {
    const client = this.getClient(ctx);
    await client.delete(court).where(eq(court.placeId, placeId));
  }

  async deletePlaceById(placeId: string, ctx?: RequestContext): Promise<void> {
    const client = this.getClient(ctx);
    await client.delete(place).where(eq(place.id, placeId));
  }

  async findAll(
    filters: AdminCourtFiltersDTO,
    ctx?: RequestContext,
  ): Promise<PaginatedAdminPlaces> {
    const client = this.getClient(ctx);

    // Build conditions
    const conditions: SQL[] = [];

    if (filters.isActive !== undefined) {
      conditions.push(eq(place.isActive, filters.isActive));
    }

    if (filters.placeType) {
      conditions.push(eq(place.placeType, filters.placeType));
    }

    if (filters.claimStatus) {
      conditions.push(eq(place.claimStatus, filters.claimStatus));
    }

    if (filters.featured === true) {
      conditions.push(gt(place.featuredRank, 0));
    }

    if (filters.featured === false) {
      conditions.push(lte(place.featuredRank, 0));
    }

    if (filters.province) {
      conditions.push(ilike(place.province, filters.province));
    }

    if (filters.city) {
      conditions.push(ilike(place.city, filters.city));
    }

    if (filters.search) {
      conditions.push(ilike(place.name, `%${filters.search}%`));
    }

    if (filters.source === "user_submitted") {
      conditions.push(isNotNull(courtSubmission.submittedByUserId));
    } else if (filters.source === "organization_managed") {
      conditions.push(isNull(courtSubmission.submittedByUserId));
      conditions.push(isNotNull(place.organizationId));
    } else if (filters.source === "admin_curated") {
      conditions.push(isNull(courtSubmission.submittedByUserId));
      conditions.push(isNull(place.organizationId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const sortColumnMap = {
      name: place.name,
      city: place.city,
      createdAt: place.createdAt,
      status: place.isActive,
    } as const;
    const sortColumn = sortColumnMap[filters.sortBy ?? "createdAt"];
    const orderFn = filters.sortOrder === "asc" ? asc : desc;

    const rows = await client
      .select({
        place,
        organizationName: organization.name,
        submittedByUserId: courtSubmission.submittedByUserId,
        total: sql<number>`count(*) over()`,
      })
      .from(place)
      .leftJoin(organization, eq(place.organizationId, organization.id))
      .leftJoin(courtSubmission, eq(place.id, courtSubmission.placeId))
      .where(whereClause)
      .orderBy(orderFn(sortColumn))
      .limit(filters.limit)
      .offset(filters.offset);

    return {
      items: rows.map((row) => ({
        place: row.place,
        organizationName: row.organizationName ?? null,
        submittedByUserId: row.submittedByUserId ?? null,
      })),
      total: rows.length > 0 ? Number(rows[0].total) : 0,
    };
  }

  async findByNameCity(
    name: string,
    city: string,
    ctx?: RequestContext,
  ): Promise<PlaceRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(place)
      .where(and(ilike(place.name, name), eq(place.city, city)))
      .limit(1);
    return result[0] ?? null;
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

  async findByFeaturedRank(
    featuredRank: number,
    ctx?: RequestContext,
  ): Promise<PlaceRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(place)
      .where(eq(place.featuredRank, featuredRank))
      .limit(1);
    return result[0] ?? null;
  }

  async findByProvinceAndProvinceRank(
    province: string,
    provinceRank: number,
    ctx?: RequestContext,
  ): Promise<PlaceRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(place)
      .where(
        and(eq(place.province, province), eq(place.provinceRank, provinceRank)),
      )
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

  async getStats(
    ctx?: RequestContext,
  ): Promise<{ total: number; reservable: number }> {
    const client = this.getClient(ctx);
    const result = await client
      .select({
        total: count(),
        reservable: sql<number>`count(*) filter (where ${place.placeType} = 'RESERVABLE')`,
      })
      .from(place);
    return {
      total: result[0]?.total ?? 0,
      reservable: Number(result[0]?.reservable ?? 0),
    };
  }

  async findDetailsById(
    id: string,
    ctx?: RequestContext,
  ): Promise<AdminPlaceDetails | null> {
    const client = this.getClient(ctx);
    const placeResult = await client
      .select()
      .from(place)
      .where(eq(place.id, id))
      .limit(1);
    const placeRecord = placeResult[0];
    if (!placeRecord) return null;

    const orgResult = placeRecord.organizationId
      ? await client
          .select({
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
          })
          .from(organization)
          .where(eq(organization.id, placeRecord.organizationId))
          .limit(1)
      : [];
    const org = orgResult[0] ?? null;

    const contactResult = await client
      .select()
      .from(placeContactDetail)
      .where(eq(placeContactDetail.placeId, id))
      .limit(1);
    const contactDetail = contactResult[0] ?? null;

    const photos = await client
      .select()
      .from(placePhoto)
      .where(eq(placePhoto.placeId, id))
      .orderBy(asc(placePhoto.displayOrder));

    const amenities = await client
      .select()
      .from(placeAmenity)
      .where(eq(placeAmenity.placeId, id));

    const courts = await client
      .select({
        court,
        sport: {
          id: sport.id,
          name: sport.name,
        },
      })
      .from(court)
      .innerJoin(sport, eq(court.sportId, sport.id))
      .where(eq(court.placeId, id))
      .orderBy(court.label);

    return {
      place: placeRecord,
      organization: org,
      contactDetail,
      photos,
      amenities,
      courts,
    };
  }
}
