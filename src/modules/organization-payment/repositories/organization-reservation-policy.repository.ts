import { eq } from "drizzle-orm";
import {
  type InsertOrganizationReservationPolicy,
  type OrganizationReservationPolicyRecord,
  organizationReservationPolicy,
} from "@/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/shared/infra/db/types";
import type { RequestContext } from "@/shared/kernel/context";
import { InternalError } from "@/shared/kernel/errors";

export interface IOrganizationReservationPolicyRepository {
  findByOrganizationId(
    organizationId: string,
    ctx?: RequestContext,
  ): Promise<OrganizationReservationPolicyRecord | null>;
  create(
    data: InsertOrganizationReservationPolicy,
    ctx?: RequestContext,
  ): Promise<OrganizationReservationPolicyRecord>;
  ensureForOrganization(
    organizationId: string,
    ctx?: RequestContext,
  ): Promise<OrganizationReservationPolicyRecord>;
  update(
    id: string,
    data: Partial<InsertOrganizationReservationPolicy>,
    ctx?: RequestContext,
  ): Promise<OrganizationReservationPolicyRecord>;
}

export class OrganizationReservationPolicyRepository
  implements IOrganizationReservationPolicyRepository
{
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findByOrganizationId(
    organizationId: string,
    ctx?: RequestContext,
  ): Promise<OrganizationReservationPolicyRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(organizationReservationPolicy)
      .where(eq(organizationReservationPolicy.organizationId, organizationId))
      .limit(1);

    return result[0] ?? null;
  }

  async create(
    data: InsertOrganizationReservationPolicy,
    ctx?: RequestContext,
  ): Promise<OrganizationReservationPolicyRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .insert(organizationReservationPolicy)
      .values(data)
      .returning();

    return result[0];
  }

  async ensureForOrganization(
    organizationId: string,
    ctx?: RequestContext,
  ): Promise<OrganizationReservationPolicyRecord> {
    const client = this.getClient(ctx);
    await client
      .insert(organizationReservationPolicy)
      .values({ organizationId })
      .onConflictDoNothing();

    const policy = await this.findByOrganizationId(organizationId, ctx);
    if (!policy) {
      throw new InternalError(
        "Failed to ensure organization reservation policy",
      );
    }

    return policy;
  }

  async update(
    id: string,
    data: Partial<InsertOrganizationReservationPolicy>,
    ctx?: RequestContext,
  ): Promise<OrganizationReservationPolicyRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .update(organizationReservationPolicy)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(organizationReservationPolicy.id, id))
      .returning();

    return result[0];
  }
}
