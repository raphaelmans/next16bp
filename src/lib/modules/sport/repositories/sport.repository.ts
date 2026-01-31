import { asc } from "drizzle-orm";
import { type SportRecord, sport } from "@/lib/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/lib/shared/infra/db/types";
import type { RequestContext } from "@/lib/shared/kernel/context";

export interface ISportRepository {
  list(ctx?: RequestContext): Promise<SportRecord[]>;
}

export class SportRepository implements ISportRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async list(ctx?: RequestContext): Promise<SportRecord[]> {
    const client = this.getClient(ctx);
    return client.select().from(sport).orderBy(asc(sport.name));
  }
}
