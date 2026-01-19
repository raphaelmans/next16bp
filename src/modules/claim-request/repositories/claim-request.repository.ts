import { and, eq } from "drizzle-orm";
import {
  type ClaimRequestRecord,
  claimRequest,
  type InsertClaimRequest,
  type InsertPlace,
  type OrganizationRecord,
  organization,
  type PlaceRecord,
  place,
} from "@/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/shared/infra/db/types";
import type { RequestContext } from "@/shared/kernel/context";

export interface IClaimRequestRepository {
  findById(
    id: string,
    ctx?: RequestContext,
  ): Promise<ClaimRequestRecord | null>;
  findByIdForUpdate(
    id: string,
    ctx: RequestContext,
  ): Promise<ClaimRequestRecord | null>;
  findByPlaceId(
    placeId: string,
    ctx?: RequestContext,
  ): Promise<ClaimRequestRecord[]>;
  findPendingByPlaceId(
    placeId: string,
    ctx?: RequestContext,
  ): Promise<ClaimRequestRecord | null>;
  findByOrganizationId(
    organizationId: string,
    ctx?: RequestContext,
  ): Promise<ClaimRequestRecord[]>;
  findPending(
    pagination: { limit: number; offset: number },
    ctx?: RequestContext,
  ): Promise<{ items: ClaimRequestRecord[]; total: number }>;
  findByRequestedByUserId(
    userId: string,
    ctx?: RequestContext,
  ): Promise<ClaimRequestRecord[]>;
  create(
    data: InsertClaimRequest,
    ctx?: RequestContext,
  ): Promise<ClaimRequestRecord>;
  update(
    id: string,
    data: Partial<InsertClaimRequest>,
    ctx?: RequestContext,
  ): Promise<ClaimRequestRecord>;
  countByPlaceAndRequester(
    placeId: string,
    requestedByUserId: string,
    ctx?: RequestContext,
  ): Promise<number>;
  countByPlaceAndGuestEmail(
    placeId: string,
    guestEmail: string,
    ctx?: RequestContext,
  ): Promise<number>;
}

export class ClaimRequestRepository implements IClaimRequestRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findById(
    id: string,
    ctx?: RequestContext,
  ): Promise<ClaimRequestRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(claimRequest)
      .where(eq(claimRequest.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  async findByIdForUpdate(
    id: string,
    ctx: RequestContext,
  ): Promise<ClaimRequestRecord | null> {
    const client = this.getClient(ctx) as DrizzleTransaction;
    const result = await client
      .select()
      .from(claimRequest)
      .where(eq(claimRequest.id, id))
      .for("update")
      .limit(1);

    return result[0] ?? null;
  }

  async findByPlaceId(
    placeId: string,
    ctx?: RequestContext,
  ): Promise<ClaimRequestRecord[]> {
    const client = this.getClient(ctx);
    return client
      .select()
      .from(claimRequest)
      .where(eq(claimRequest.placeId, placeId));
  }

  async findPendingByPlaceId(
    placeId: string,
    ctx?: RequestContext,
  ): Promise<ClaimRequestRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(claimRequest)
      .where(
        and(
          eq(claimRequest.placeId, placeId),
          eq(claimRequest.status, "PENDING"),
        ),
      )
      .limit(1);

    return result[0] ?? null;
  }

  async findByOrganizationId(
    organizationId: string,
    ctx?: RequestContext,
  ): Promise<ClaimRequestRecord[]> {
    const client = this.getClient(ctx);
    return client
      .select()
      .from(claimRequest)
      .where(eq(claimRequest.organizationId, organizationId));
  }

  async findPending(
    pagination: { limit: number; offset: number },
    ctx?: RequestContext,
  ): Promise<{ items: ClaimRequestRecord[]; total: number }> {
    const client = this.getClient(ctx);

    const items = await client
      .select()
      .from(claimRequest)
      .where(eq(claimRequest.status, "PENDING"))
      .limit(pagination.limit)
      .offset(pagination.offset);

    const countResult = await client
      .select()
      .from(claimRequest)
      .where(eq(claimRequest.status, "PENDING"));

    return {
      items,
      total: countResult.length,
    };
  }

  async findByRequestedByUserId(
    userId: string,
    ctx?: RequestContext,
  ): Promise<ClaimRequestRecord[]> {
    const client = this.getClient(ctx);
    return client
      .select()
      .from(claimRequest)
      .where(eq(claimRequest.requestedByUserId, userId));
  }

  async create(
    data: InsertClaimRequest,
    ctx?: RequestContext,
  ): Promise<ClaimRequestRecord> {
    const client = this.getClient(ctx);
    const result = await client.insert(claimRequest).values(data).returning();
    return result[0];
  }

  async update(
    id: string,
    data: Partial<InsertClaimRequest>,
    ctx?: RequestContext,
  ): Promise<ClaimRequestRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .update(claimRequest)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(claimRequest.id, id))
      .returning();
    return result[0];
  }

  async countByPlaceAndRequester(
    placeId: string,
    requestedByUserId: string,
    ctx?: RequestContext,
  ): Promise<number> {
    const client = this.getClient(ctx);
    const result = await client
      .select({ id: claimRequest.id })
      .from(claimRequest)
      .where(
        and(
          eq(claimRequest.placeId, placeId),
          eq(claimRequest.requestedByUserId, requestedByUserId),
        ),
      );
    return result.length;
  }

  async countByPlaceAndGuestEmail(
    placeId: string,
    guestEmail: string,
    ctx?: RequestContext,
  ): Promise<number> {
    const client = this.getClient(ctx);
    const result = await client
      .select({ id: claimRequest.id })
      .from(claimRequest)
      .where(
        and(
          eq(claimRequest.placeId, placeId),
          eq(claimRequest.guestEmail, guestEmail),
        ),
      );
    return result.length;
  }
}

export interface IOrganizationRepository {
  findById(
    id: string,
    ctx?: RequestContext,
  ): Promise<OrganizationRecord | null>;
}

export class OrganizationRepository implements IOrganizationRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findById(
    id: string,
    ctx?: RequestContext,
  ): Promise<OrganizationRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(organization)
      .where(eq(organization.id, id))
      .limit(1);

    return result[0] ?? null;
  }
}

export interface IClaimPlaceRepository {
  findById(id: string, ctx?: RequestContext): Promise<PlaceRecord | null>;
  findByIdForUpdate(
    id: string,
    ctx: RequestContext,
  ): Promise<PlaceRecord | null>;
  update(
    id: string,
    data: Partial<InsertPlace>,
    ctx?: RequestContext,
  ): Promise<PlaceRecord>;
}

export class ClaimPlaceRepository implements IClaimPlaceRepository {
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
}
