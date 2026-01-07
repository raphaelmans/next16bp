import { eq, and, ilike, count, type SQL } from "drizzle-orm";
import {
  court,
  curatedCourtDetail,
  courtPhoto,
  courtAmenity,
  type CourtRecord,
  type InsertCourt,
  type CuratedCourtDetailRecord,
  type InsertCuratedCourtDetail,
  type CourtPhotoRecord,
  type InsertCourtPhoto,
  type CourtAmenityRecord,
  type InsertCourtAmenity,
} from "@/shared/infra/db/schema";
import type { RequestContext } from "@/shared/kernel/context";
import type { DbClient, DrizzleTransaction } from "@/shared/infra/db/types";
import type { AdminCourtFiltersDTO } from "../dtos";

/**
 * Admin court list item
 */
export interface AdminCourtListItem {
  court: CourtRecord;
}

/**
 * Paginated admin court result
 */
export interface PaginatedAdminCourts {
  items: AdminCourtListItem[];
  total: number;
}

/**
 * Created curated court result
 */
export interface CreatedCuratedCourt {
  court: CourtRecord;
  detail: CuratedCourtDetailRecord;
  photos: CourtPhotoRecord[];
  amenities: CourtAmenityRecord[];
}

export interface IAdminCourtRepository {
  create(data: InsertCourt, ctx?: RequestContext): Promise<CourtRecord>;
  update(
    id: string,
    data: Partial<InsertCourt>,
    ctx?: RequestContext,
  ): Promise<CourtRecord>;
  createCuratedDetail(
    data: InsertCuratedCourtDetail,
    ctx?: RequestContext,
  ): Promise<CuratedCourtDetailRecord>;
  createPhoto(
    data: InsertCourtPhoto,
    ctx?: RequestContext,
  ): Promise<CourtPhotoRecord>;
  createAmenity(
    data: InsertCourtAmenity,
    ctx?: RequestContext,
  ): Promise<CourtAmenityRecord>;
  findAll(
    filters: AdminCourtFiltersDTO,
    ctx?: RequestContext,
  ): Promise<PaginatedAdminCourts>;
  findById(id: string, ctx?: RequestContext): Promise<CourtRecord | null>;
}

export class AdminCourtRepository implements IAdminCourtRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async create(data: InsertCourt, ctx?: RequestContext): Promise<CourtRecord> {
    const client = this.getClient(ctx);
    const result = await client.insert(court).values(data).returning();
    return result[0];
  }

  async update(
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

  async createCuratedDetail(
    data: InsertCuratedCourtDetail,
    ctx?: RequestContext,
  ): Promise<CuratedCourtDetailRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .insert(curatedCourtDetail)
      .values(data)
      .returning();
    return result[0];
  }

  async createPhoto(
    data: InsertCourtPhoto,
    ctx?: RequestContext,
  ): Promise<CourtPhotoRecord> {
    const client = this.getClient(ctx);
    const result = await client.insert(courtPhoto).values(data).returning();
    return result[0];
  }

  async createAmenity(
    data: InsertCourtAmenity,
    ctx?: RequestContext,
  ): Promise<CourtAmenityRecord> {
    const client = this.getClient(ctx);
    const result = await client.insert(courtAmenity).values(data).returning();
    return result[0];
  }

  async findAll(
    filters: AdminCourtFiltersDTO,
    ctx?: RequestContext,
  ): Promise<PaginatedAdminCourts> {
    const client = this.getClient(ctx);

    // Build conditions
    const conditions: SQL[] = [];

    if (filters.isActive !== undefined) {
      conditions.push(eq(court.isActive, filters.isActive));
    }

    if (filters.courtType) {
      conditions.push(eq(court.courtType, filters.courtType));
    }

    if (filters.claimStatus) {
      conditions.push(eq(court.claimStatus, filters.claimStatus));
    }

    if (filters.city) {
      conditions.push(eq(court.city, filters.city));
    }

    if (filters.search) {
      conditions.push(ilike(court.name, `%${filters.search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Count
    const countResult = await client
      .select({ count: count() })
      .from(court)
      .where(whereClause);

    // Get courts
    const courts = await client
      .select()
      .from(court)
      .where(whereClause)
      .limit(filters.limit)
      .offset(filters.offset);

    return {
      items: courts.map((c) => ({ court: c })),
      total: countResult[0]?.count ?? 0,
    };
  }

  async findById(
    id: string,
    ctx?: RequestContext,
  ): Promise<CourtRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(court)
      .where(eq(court.id, id))
      .limit(1);
    return result[0] ?? null;
  }
}
