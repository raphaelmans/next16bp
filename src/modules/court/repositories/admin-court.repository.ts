import { and, count, eq, ilike, type SQL } from "drizzle-orm";
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

    if (filters.city) {
      conditions.push(eq(place.city, filters.city));
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
}
