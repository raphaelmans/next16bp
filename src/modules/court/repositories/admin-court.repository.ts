import { and, asc, count, eq, ilike, type SQL } from "drizzle-orm";
import {
  type CourtRecord,
  court,
  type InsertCourt,
  type InsertPlace,
  type InsertPlaceAmenity,
  type InsertPlaceContactDetail,
  type InsertPlacePhoto,
  type PlaceAmenityRecord,
  type PlaceContactDetailRecord,
  type PlacePhotoRecord,
  type PlaceRecord,
  place,
  placeAmenity,
  placeContactDetail,
  placePhoto,
  sport,
} from "@/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/shared/infra/db/types";
import type { RequestContext } from "@/shared/kernel/context";
import type { AdminCourtFiltersDTO } from "../dtos";

/**
 * Admin place list item
 */
export interface AdminPlaceListItem {
  place: PlaceRecord;
}

export interface AdminPlaceDetails {
  place: PlaceRecord;
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
  countPhotosByPlaceId(placeId: string, ctx?: RequestContext): Promise<number>;
  findAll(
    filters: AdminCourtFiltersDTO,
    ctx?: RequestContext,
  ): Promise<PaginatedAdminPlaces>;
  findById(id: string, ctx?: RequestContext): Promise<PlaceRecord | null>;
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

    if (filters.province) {
      conditions.push(ilike(place.province, filters.province));
    }

    if (filters.city) {
      conditions.push(ilike(place.city, filters.city));
    }

    if (filters.search) {
      conditions.push(ilike(place.name, `%${filters.search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Count
    const countResult = await client
      .select({ count: count() })
      .from(place)
      .where(whereClause);

    // Get places
    const places = await client
      .select()
      .from(place)
      .where(whereClause)
      .limit(filters.limit)
      .offset(filters.offset);

    return {
      items: places.map((row) => ({ place: row })),
      total: countResult[0]?.count ?? 0,
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
      contactDetail,
      photos,
      amenities,
      courts,
    };
  }
}
