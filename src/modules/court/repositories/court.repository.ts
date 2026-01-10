import { and, count, eq } from "drizzle-orm";
import {
  type CourtAmenityRecord,
  type CourtPhotoRecord,
  type CourtRecord,
  type CuratedCourtDetailRecord,
  court,
  courtAmenity,
  courtPhoto,
  curatedCourtDetail,
  type OrganizationRecord,
  organization,
  type ReservableCourtDetailRecord,
  reservableCourtDetail,
} from "@/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/shared/infra/db/types";
import type { RequestContext } from "@/shared/kernel/context";
import type { SearchCourtsDTO } from "../dtos";

/**
 * Response type for court with all details
 */
export interface CourtWithDetails {
  court: CourtRecord;
  detail: CuratedCourtDetailRecord | ReservableCourtDetailRecord | null;
  photos: CourtPhotoRecord[];
  amenities: CourtAmenityRecord[];
  organization?: OrganizationRecord;
}

/**
 * Response type for court list items (optimized for listing)
 */
export interface CourtListItem {
  court: CourtRecord;
  photoUrl?: string;
  amenityCount: number;
  isFree?: boolean;
}

/**
 * Paginated result type
 */
export interface PaginatedCourts {
  items: CourtListItem[];
  total: number;
}

export interface ICourtRepository {
  findById(id: string, ctx?: RequestContext): Promise<CourtRecord | null>;
  findByIdForUpdate(
    id: string,
    ctx: RequestContext,
  ): Promise<CourtRecord | null>;
  findWithDetails(
    id: string,
    ctx?: RequestContext,
  ): Promise<CourtWithDetails | null>;
  search(
    filters: SearchCourtsDTO,
    ctx?: RequestContext,
  ): Promise<PaginatedCourts>;
  listByCity(
    city: string,
    pagination: { limit: number; offset: number },
    ctx?: RequestContext,
  ): Promise<PaginatedCourts>;
  // Write methods
  create(
    data: {
      organizationId?: string | null;
      name: string;
      address: string;
      city: string;
      latitude: string;
      longitude: string;
      courtType: "CURATED" | "RESERVABLE";
      claimStatus?:
        | "UNCLAIMED"
        | "CLAIM_PENDING"
        | "CLAIMED"
        | "REMOVAL_REQUESTED";
    },
    ctx?: RequestContext,
  ): Promise<CourtRecord>;
  update(
    id: string,
    data: Partial<{
      organizationId: string | null;
      name: string;
      address: string;
      city: string;
      latitude: string;
      longitude: string;
      claimStatus:
        | "UNCLAIMED"
        | "CLAIM_PENDING"
        | "CLAIMED"
        | "REMOVAL_REQUESTED";
      isActive: boolean;
    }>,
    ctx?: RequestContext,
  ): Promise<CourtRecord>;
  findByOrganizationId(
    orgId: string,
    ctx?: RequestContext,
  ): Promise<CourtRecord[]>;
}

export class CourtRepository implements ICourtRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
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

  async findByIdForUpdate(
    id: string,
    ctx: RequestContext,
  ): Promise<CourtRecord | null> {
    const client = this.getClient(ctx) as DrizzleTransaction;
    const result = await client
      .select()
      .from(court)
      .where(eq(court.id, id))
      .for("update")
      .limit(1);

    return result[0] ?? null;
  }

  async findWithDetails(
    id: string,
    ctx?: RequestContext,
  ): Promise<CourtWithDetails | null> {
    const client = this.getClient(ctx);

    // Get court record
    const courtResult = await client
      .select()
      .from(court)
      .where(eq(court.id, id))
      .limit(1);

    if (!courtResult[0]) return null;

    const c = courtResult[0];

    // Get detail based on court type
    let detail: CuratedCourtDetailRecord | ReservableCourtDetailRecord | null =
      null;
    if (c.courtType === "CURATED") {
      const detailResult = await client
        .select()
        .from(curatedCourtDetail)
        .where(eq(curatedCourtDetail.courtId, id))
        .limit(1);
      detail = detailResult[0] ?? null;
    } else {
      const detailResult = await client
        .select()
        .from(reservableCourtDetail)
        .where(eq(reservableCourtDetail.courtId, id))
        .limit(1);
      detail = detailResult[0] ?? null;
    }

    // Get photos ordered by displayOrder
    const photos = await client
      .select()
      .from(courtPhoto)
      .where(eq(courtPhoto.courtId, id))
      .orderBy(courtPhoto.displayOrder);

    // Get amenities
    const amenities = await client
      .select()
      .from(courtAmenity)
      .where(eq(courtAmenity.courtId, id));

    // Get organization if reservable and has organizationId
    let org: OrganizationRecord | undefined;
    if (c.courtType === "RESERVABLE" && c.organizationId) {
      const orgResult = await client
        .select()
        .from(organization)
        .where(eq(organization.id, c.organizationId))
        .limit(1);
      org = orgResult[0];
    }

    return {
      court: c,
      detail,
      photos,
      amenities,
      organization: org,
    };
  }

  async search(
    filters: SearchCourtsDTO,
    ctx?: RequestContext,
  ): Promise<PaginatedCourts> {
    const client = this.getClient(ctx);

    // Build conditions array
    const conditions = [eq(court.isActive, true)];

    if (filters.city) {
      conditions.push(eq(court.city, filters.city));
    }

    if (filters.courtType) {
      conditions.push(eq(court.courtType, filters.courtType));
    }

    // Handle isFree filter - requires join with reservable_court_detail
    if (filters.isFree !== undefined) {
      // Only applicable for RESERVABLE courts
      conditions.push(eq(court.courtType, "RESERVABLE"));
    }

    // Count total (without isFree join for simplicity, will be refined in query)
    const baseCondition = and(...conditions);

    // For isFree filter, we need a different approach
    if (filters.isFree !== undefined) {
      // Query with join
      const countResult = await client
        .select({ count: count() })
        .from(court)
        .innerJoin(
          reservableCourtDetail,
          eq(court.id, reservableCourtDetail.courtId),
        )
        .where(
          and(baseCondition, eq(reservableCourtDetail.isFree, filters.isFree)),
        );

      const courtsWithJoin = await client
        .select({
          court: court,
          isFree: reservableCourtDetail.isFree,
        })
        .from(court)
        .innerJoin(
          reservableCourtDetail,
          eq(court.id, reservableCourtDetail.courtId),
        )
        .where(
          and(baseCondition, eq(reservableCourtDetail.isFree, filters.isFree)),
        )
        .limit(filters.limit)
        .offset(filters.offset);

      // Get photos and amenity counts for each court
      const items: CourtListItem[] = await Promise.all(
        courtsWithJoin.map(async (row) => {
          const firstPhoto = await client
            .select()
            .from(courtPhoto)
            .where(eq(courtPhoto.courtId, row.court.id))
            .orderBy(courtPhoto.displayOrder)
            .limit(1);

          const amenityCountResult = await client
            .select({ count: count() })
            .from(courtAmenity)
            .where(eq(courtAmenity.courtId, row.court.id));

          return {
            court: row.court,
            photoUrl: firstPhoto[0]?.url,
            amenityCount: amenityCountResult[0]?.count ?? 0,
            isFree: row.isFree,
          };
        }),
      );

      return {
        items,
        total: countResult[0]?.count ?? 0,
      };
    }

    // Standard query without isFree join
    const countResult = await client
      .select({ count: count() })
      .from(court)
      .where(baseCondition);

    const courts = await client
      .select()
      .from(court)
      .where(baseCondition)
      .limit(filters.limit)
      .offset(filters.offset);

    // Get photos and amenity counts for each court
    const items: CourtListItem[] = await Promise.all(
      courts.map(async (c) => {
        const firstPhoto = await client
          .select()
          .from(courtPhoto)
          .where(eq(courtPhoto.courtId, c.id))
          .orderBy(courtPhoto.displayOrder)
          .limit(1);

        const amenityCountResult = await client
          .select({ count: count() })
          .from(courtAmenity)
          .where(eq(courtAmenity.courtId, c.id));

        // Get isFree if reservable
        let isFree: boolean | undefined;
        if (c.courtType === "RESERVABLE") {
          const detail = await client
            .select({ isFree: reservableCourtDetail.isFree })
            .from(reservableCourtDetail)
            .where(eq(reservableCourtDetail.courtId, c.id))
            .limit(1);
          isFree = detail[0]?.isFree;
        }

        return {
          court: c,
          photoUrl: firstPhoto[0]?.url,
          amenityCount: amenityCountResult[0]?.count ?? 0,
          isFree,
        };
      }),
    );

    return {
      items,
      total: countResult[0]?.count ?? 0,
    };
  }

  async listByCity(
    city: string,
    pagination: { limit: number; offset: number },
    ctx?: RequestContext,
  ): Promise<PaginatedCourts> {
    return this.search(
      {
        city,
        limit: pagination.limit,
        offset: pagination.offset,
      },
      ctx,
    );
  }

  async create(
    data: {
      organizationId?: string | null;
      name: string;
      address: string;
      city: string;
      latitude: string;
      longitude: string;
      courtType: "CURATED" | "RESERVABLE";
      claimStatus?:
        | "UNCLAIMED"
        | "CLAIM_PENDING"
        | "CLAIMED"
        | "REMOVAL_REQUESTED";
    },
    ctx?: RequestContext,
  ): Promise<CourtRecord> {
    const client = this.getClient(ctx);
    const result = await client.insert(court).values(data).returning();
    return result[0];
  }

  async update(
    id: string,
    data: Partial<{
      organizationId: string | null;
      name: string;
      address: string;
      city: string;
      latitude: string;
      longitude: string;
      claimStatus:
        | "UNCLAIMED"
        | "CLAIM_PENDING"
        | "CLAIMED"
        | "REMOVAL_REQUESTED";
      isActive: boolean;
    }>,
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

  async findByOrganizationId(
    orgId: string,
    ctx?: RequestContext,
  ): Promise<CourtRecord[]> {
    const client = this.getClient(ctx);
    return client.select().from(court).where(eq(court.organizationId, orgId));
  }
}
