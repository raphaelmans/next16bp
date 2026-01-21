import { eq } from "drizzle-orm";
import {
  type ContactMessageRecord,
  type InsertContactMessage,
  contactMessage,
} from "@/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/shared/infra/db/types";
import type { RequestContext } from "@/shared/kernel/context";

export interface IContactMessageRepository {
  create(
    data: InsertContactMessage,
    ctx?: RequestContext,
  ): Promise<ContactMessageRecord>;
  update(
    id: string,
    data: Partial<InsertContactMessage>,
    ctx?: RequestContext,
  ): Promise<ContactMessageRecord>;
}

export class ContactMessageRepository implements IContactMessageRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async create(
    data: InsertContactMessage,
    ctx?: RequestContext,
  ): Promise<ContactMessageRecord> {
    const client = this.getClient(ctx);
    const result = await client.insert(contactMessage).values(data).returning();

    return result[0];
  }

  async update(
    id: string,
    data: Partial<InsertContactMessage>,
    ctx?: RequestContext,
  ): Promise<ContactMessageRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .update(contactMessage)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(contactMessage.id, id))
      .returning();

    return result[0];
  }
}
