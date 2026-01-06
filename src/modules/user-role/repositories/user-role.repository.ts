import { eq } from "drizzle-orm";
import {
  userRoles,
  type UserRoleRecord,
  type InsertUserRole,
} from "@/shared/infra/db/schema";
import type { RequestContext } from "@/shared/kernel/context";
import type { DbClient, DrizzleTransaction } from "@/shared/infra/db/types";

export interface IUserRoleRepository {
  findByUserId(
    userId: string,
    ctx?: RequestContext,
  ): Promise<UserRoleRecord | null>;
  create(data: InsertUserRole, ctx?: RequestContext): Promise<UserRoleRecord>;
}

export class UserRoleRepository implements IUserRoleRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findByUserId(
    userId: string,
    ctx?: RequestContext,
  ): Promise<UserRoleRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(userRoles)
      .where(eq(userRoles.userId, userId))
      .limit(1);

    return result[0] ?? null;
  }

  async create(
    data: InsertUserRole,
    ctx?: RequestContext,
  ): Promise<UserRoleRecord> {
    const client = this.getClient(ctx);
    const result = await client.insert(userRoles).values(data).returning();

    return result[0];
  }
}
