import { count, eq } from "drizzle-orm";
import {
  type ExternalOpenPlayReportRecord,
  externalOpenPlayReport,
  type InsertExternalOpenPlayReport,
} from "@/lib/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/lib/shared/infra/db/types";
import type { RequestContext } from "@/lib/shared/kernel/context";

export interface IExternalOpenPlayReportRepository {
  create(
    data: InsertExternalOpenPlayReport,
    ctx?: RequestContext,
  ): Promise<ExternalOpenPlayReportRecord | null>;
  countByOpenPlayId(
    externalOpenPlayId: string,
    ctx?: RequestContext,
  ): Promise<number>;
}

export class ExternalOpenPlayReportRepository
  implements IExternalOpenPlayReportRepository
{
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async create(
    data: InsertExternalOpenPlayReport,
    ctx?: RequestContext,
  ): Promise<ExternalOpenPlayReportRecord | null> {
    const client = this.getClient(ctx);
    const rows = await client
      .insert(externalOpenPlayReport)
      .values(data)
      .onConflictDoNothing({
        target: [
          externalOpenPlayReport.externalOpenPlayId,
          externalOpenPlayReport.reporterProfileId,
        ],
      })
      .returning();
    return rows[0] ?? null;
  }

  async countByOpenPlayId(
    externalOpenPlayId: string,
    ctx?: RequestContext,
  ): Promise<number> {
    const client = this.getClient(ctx);
    const [row] = await client
      .select({ value: count() })
      .from(externalOpenPlayReport)
      .where(eq(externalOpenPlayReport.externalOpenPlayId, externalOpenPlayId));

    return Number(row?.value ?? 0);
  }
}
