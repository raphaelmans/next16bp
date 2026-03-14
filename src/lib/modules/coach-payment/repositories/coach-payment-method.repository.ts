import { desc, eq } from "drizzle-orm";
import {
  type CoachPaymentMethodRecord,
  coachPaymentMethod,
  type InsertCoachPaymentMethod,
} from "@/lib/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/lib/shared/infra/db/types";
import type { RequestContext } from "@/lib/shared/kernel/context";

export interface ICoachPaymentMethodRepository {
  findById(
    id: string,
    ctx?: RequestContext,
  ): Promise<CoachPaymentMethodRecord | null>;
  findByCoachId(
    coachId: string,
    ctx?: RequestContext,
  ): Promise<CoachPaymentMethodRecord[]>;
  create(
    data: InsertCoachPaymentMethod,
    ctx?: RequestContext,
  ): Promise<CoachPaymentMethodRecord>;
  update(
    id: string,
    data: Partial<InsertCoachPaymentMethod>,
    ctx?: RequestContext,
  ): Promise<CoachPaymentMethodRecord>;
  delete(id: string, ctx?: RequestContext): Promise<void>;
  clearDefault(coachId: string, ctx?: RequestContext): Promise<void>;
}

export class CoachPaymentMethodRepository
  implements ICoachPaymentMethodRepository
{
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findById(
    id: string,
    ctx?: RequestContext,
  ): Promise<CoachPaymentMethodRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(coachPaymentMethod)
      .where(eq(coachPaymentMethod.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  async findByCoachId(
    coachId: string,
    ctx?: RequestContext,
  ): Promise<CoachPaymentMethodRecord[]> {
    const client = this.getClient(ctx);
    return client
      .select()
      .from(coachPaymentMethod)
      .where(eq(coachPaymentMethod.coachId, coachId))
      .orderBy(
        desc(coachPaymentMethod.isDefault),
        coachPaymentMethod.createdAt,
      );
  }

  async create(
    data: InsertCoachPaymentMethod,
    ctx?: RequestContext,
  ): Promise<CoachPaymentMethodRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .insert(coachPaymentMethod)
      .values(data)
      .returning();

    return result[0];
  }

  async update(
    id: string,
    data: Partial<InsertCoachPaymentMethod>,
    ctx?: RequestContext,
  ): Promise<CoachPaymentMethodRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .update(coachPaymentMethod)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(coachPaymentMethod.id, id))
      .returning();

    return result[0];
  }

  async delete(id: string, ctx?: RequestContext): Promise<void> {
    const client = this.getClient(ctx);
    await client
      .delete(coachPaymentMethod)
      .where(eq(coachPaymentMethod.id, id));
  }

  async clearDefault(coachId: string, ctx?: RequestContext): Promise<void> {
    const client = this.getClient(ctx);
    await client
      .update(coachPaymentMethod)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(eq(coachPaymentMethod.coachId, coachId));
  }
}
