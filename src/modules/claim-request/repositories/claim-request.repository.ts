import { and, eq } from "drizzle-orm";
import {
  type ClaimRequestRecord,
  type CourtRecord,
  claimRequest,
  court,
  type InsertClaimRequest,
  type InsertCourt,
  type OrganizationRecord,
  organization,
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
  findByCourtId(
    courtId: string,
    ctx?: RequestContext,
  ): Promise<ClaimRequestRecord[]>;
  findPendingByCourtId(
    courtId: string,
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

  async findByCourtId(
    courtId: string,
    ctx?: RequestContext,
  ): Promise<ClaimRequestRecord[]> {
    const client = this.getClient(ctx);
    return client
      .select()
      .from(claimRequest)
      .where(eq(claimRequest.courtId, courtId));
  }

  async findPendingByCourtId(
    courtId: string,
    ctx?: RequestContext,
  ): Promise<ClaimRequestRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(claimRequest)
      .where(
        and(
          eq(claimRequest.courtId, courtId),
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
}

/**
 * Organization repository for claim request module
 */
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

/**
 * Court repository for claim request module (extended with update)
 */
export interface IClaimCourtRepository {
  findById(id: string, ctx?: RequestContext): Promise<CourtRecord | null>;
  findByIdForUpdate(
    id: string,
    ctx: RequestContext,
  ): Promise<CourtRecord | null>;
  update(
    id: string,
    data: Partial<InsertCourt>,
    ctx?: RequestContext,
  ): Promise<CourtRecord>;
}

export class ClaimCourtRepository implements IClaimCourtRepository {
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
}
