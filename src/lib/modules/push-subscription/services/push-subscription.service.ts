import type { PushSubscriptionRecord } from "@/lib/shared/infra/db/schema";
import { logger } from "@/lib/shared/infra/logger";
import type { RequestContext } from "@/lib/shared/kernel/context";
import type { TransactionManager } from "@/lib/shared/kernel/transaction";
import type { IPushSubscriptionRepository } from "../repositories/push-subscription.repository";

export interface IPushSubscriptionService {
  listMyActiveSubscriptions(
    userId: string,
    ctx?: RequestContext,
  ): Promise<PushSubscriptionRecord[]>;
  upsertMySubscription(
    userId: string,
    data: {
      endpoint: string;
      p256dh: string;
      auth: string;
      expirationTime?: string | null;
      userAgent?: string | null;
    },
    ctx?: RequestContext,
  ): Promise<PushSubscriptionRecord>;
  revokeMySubscription(
    userId: string,
    input: { id?: string; endpoint?: string },
    ctx?: RequestContext,
  ): Promise<PushSubscriptionRecord | null>;
}

export class PushSubscriptionService implements IPushSubscriptionService {
  constructor(
    private repo: IPushSubscriptionRepository,
    private transactionManager: TransactionManager,
  ) {}

  async listMyActiveSubscriptions(
    userId: string,
    ctx?: RequestContext,
  ): Promise<PushSubscriptionRecord[]> {
    return this.repo.listActiveByUserId(userId, ctx);
  }

  async upsertMySubscription(
    userId: string,
    data: {
      endpoint: string;
      p256dh: string;
      auth: string;
      expirationTime?: string | null;
      userAgent?: string | null;
    },
    ctx?: RequestContext,
  ): Promise<PushSubscriptionRecord> {
    if (ctx?.tx) {
      return this.upsertInternal(userId, data, ctx);
    }
    return this.transactionManager.run((tx) =>
      this.upsertInternal(userId, data, { tx }),
    );
  }

  private async upsertInternal(
    userId: string,
    data: {
      endpoint: string;
      p256dh: string;
      auth: string;
      expirationTime?: string | null;
      userAgent?: string | null;
    },
    ctx: RequestContext,
  ): Promise<PushSubscriptionRecord> {
    const record = await this.repo.upsertByEndpoint(
      {
        userId,
        endpoint: data.endpoint,
        p256dh: data.p256dh,
        auth: data.auth,
        expirationTime: data.expirationTime ?? null,
        userAgent: data.userAgent ?? null,
      },
      ctx,
    );

    logger.info(
      {
        event: "push_subscription.upserted",
        userId,
        subscriptionId: record.id,
      },
      "Push subscription upserted",
    );

    return record;
  }

  async revokeMySubscription(
    userId: string,
    input: { id?: string; endpoint?: string },
    ctx?: RequestContext,
  ): Promise<PushSubscriptionRecord | null> {
    const revoke = async (ctx: RequestContext) => {
      if (input.id) {
        return this.repo.revokeByIdForUser(userId, input.id, ctx);
      }
      if (input.endpoint) {
        return this.repo.revokeByEndpointForUser(userId, input.endpoint, ctx);
      }
      return null;
    };

    const result = ctx?.tx
      ? await revoke(ctx)
      : await this.transactionManager.run((tx) => revoke({ tx }));

    if (result) {
      logger.info(
        {
          event: "push_subscription.revoked",
          userId,
          subscriptionId: result.id,
        },
        "Push subscription revoked",
      );
    }

    return result;
  }
}
