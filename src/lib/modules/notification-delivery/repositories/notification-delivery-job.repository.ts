import { and, asc, inArray, isNull, lte, or } from "drizzle-orm";
import {
  type InsertNotificationDeliveryJob,
  type NotificationDeliveryJobRecord,
  notificationDeliveryJob,
} from "@/lib/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/lib/shared/infra/db/types";
import type { RequestContext } from "@/lib/shared/kernel/context";

export interface INotificationDeliveryJobRepository {
  createMany(
    data: InsertNotificationDeliveryJob[],
    ctx?: RequestContext,
  ): Promise<NotificationDeliveryJobRecord[]>;
  update(
    id: string,
    data: Partial<InsertNotificationDeliveryJob>,
    ctx?: RequestContext,
  ): Promise<NotificationDeliveryJobRecord>;
  claimBatch(options: {
    limit: number;
    now: Date;
    maxAttempts: number;
  }): Promise<NotificationDeliveryJobRecord[]>;
}

export class NotificationDeliveryJobRepository
  implements INotificationDeliveryJobRepository
{
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async createMany(
    data: InsertNotificationDeliveryJob[],
    ctx?: RequestContext,
  ): Promise<NotificationDeliveryJobRecord[]> {
    if (!data.length) return [];
    const client = this.getClient(ctx);
    const result = await client
      .insert(notificationDeliveryJob)
      .values(data)
      .returning();

    return result;
  }

  async update(
    id: string,
    data: Partial<InsertNotificationDeliveryJob>,
    ctx?: RequestContext,
  ): Promise<NotificationDeliveryJobRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .update(notificationDeliveryJob)
      .set({ ...data, updatedAt: new Date() })
      .where(inArray(notificationDeliveryJob.id, [id]))
      .returning();

    return result[0];
  }

  async claimBatch(options: {
    limit: number;
    now: Date;
    maxAttempts: number;
  }): Promise<NotificationDeliveryJobRecord[]> {
    const { limit, now, maxAttempts } = options;
    if (limit <= 0) return [];

    return this.db.transaction(async (tx) => {
      const jobs = await tx
        .select()
        .from(notificationDeliveryJob)
        .where(
          and(
            inArray(notificationDeliveryJob.status, ["PENDING", "FAILED"]),
            lte(notificationDeliveryJob.attemptCount, maxAttempts - 1),
            or(
              isNull(notificationDeliveryJob.nextAttemptAt),
              lte(notificationDeliveryJob.nextAttemptAt, now),
            ),
          ),
        )
        .orderBy(asc(notificationDeliveryJob.createdAt))
        .limit(limit)
        .for("update");

      if (!jobs.length) {
        return [];
      }

      await tx
        .update(notificationDeliveryJob)
        .set({ status: "SENDING", updatedAt: now })
        .where(
          inArray(
            notificationDeliveryJob.id,
            jobs.map((job) => job.id),
          ),
        );

      return jobs.map((job) => ({ ...job, status: "SENDING", updatedAt: now }));
    });
  }
}
