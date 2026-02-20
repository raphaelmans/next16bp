import type { MobilePushTokenRecord } from "@/lib/shared/infra/db/schema";
import { logger } from "@/lib/shared/infra/logger";
import type { RequestContext } from "@/lib/shared/kernel/context";
import type { TransactionManager } from "@/lib/shared/kernel/transaction";
import type { IMobilePushTokenRepository } from "../repositories/mobile-push-token.repository";

export interface IMobilePushTokenService {
  upsertToken(
    userId: string,
    data: { token: string; platform: "ios" | "android" },
    ctx?: RequestContext,
  ): Promise<MobilePushTokenRecord>;
  revokeToken(
    userId: string,
    data: { token: string },
    ctx?: RequestContext,
  ): Promise<MobilePushTokenRecord | null>;
  listActiveByUserId(
    userId: string,
    ctx?: RequestContext,
  ): Promise<MobilePushTokenRecord[]>;
}

export class MobilePushTokenService implements IMobilePushTokenService {
  constructor(
    private repo: IMobilePushTokenRepository,
    private transactionManager: TransactionManager,
  ) {}

  async upsertToken(
    userId: string,
    data: { token: string; platform: "ios" | "android" },
    ctx?: RequestContext,
  ): Promise<MobilePushTokenRecord> {
    if (ctx?.tx) {
      return this.upsertInternal(userId, data, ctx);
    }
    return this.transactionManager.run((tx) =>
      this.upsertInternal(userId, data, { tx }),
    );
  }

  private async upsertInternal(
    userId: string,
    data: { token: string; platform: "ios" | "android" },
    ctx: RequestContext,
  ): Promise<MobilePushTokenRecord> {
    const record = await this.repo.upsertByToken(
      {
        userId,
        token: data.token,
        platform: data.platform,
      },
      ctx,
    );

    logger.info(
      {
        event: "mobile_push_token.upserted",
        userId,
        tokenId: record.id,
        platform: data.platform,
      },
      "Mobile push token upserted",
    );

    return record;
  }

  async revokeToken(
    userId: string,
    data: { token: string },
    ctx?: RequestContext,
  ): Promise<MobilePushTokenRecord | null> {
    const revoke = async (ctx: RequestContext) => {
      return this.repo.revokeByTokenForUser(userId, data.token, ctx);
    };

    const result = ctx?.tx
      ? await revoke(ctx)
      : await this.transactionManager.run((tx) => revoke({ tx }));

    if (result) {
      logger.info(
        {
          event: "mobile_push_token.revoked",
          userId,
          tokenId: result.id,
        },
        "Mobile push token revoked",
      );
    }

    return result;
  }

  async listActiveByUserId(
    userId: string,
    ctx?: RequestContext,
  ): Promise<MobilePushTokenRecord[]> {
    return this.repo.listActiveByUserId(userId, ctx);
  }
}
