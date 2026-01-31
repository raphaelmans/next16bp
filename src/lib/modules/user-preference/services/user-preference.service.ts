import type { UserPreferenceRecord } from "@/lib/shared/infra/db/schema";
import { logger } from "@/lib/shared/infra/logger";
import type { RequestContext } from "@/lib/shared/kernel/context";
import type { TransactionManager } from "@/lib/shared/kernel/transaction";
import type { IUserPreferenceRepository } from "../repositories/user-preference.repository";

export type DefaultPortal = UserPreferenceRecord["defaultPortal"];

export interface IUserPreferenceService {
  findByUserId(
    userId: string,
    ctx?: RequestContext,
  ): Promise<UserPreferenceRecord | null>;
  setDefaultPortal(
    userId: string,
    defaultPortal: DefaultPortal,
    ctx?: RequestContext,
  ): Promise<UserPreferenceRecord>;
}

export class UserPreferenceService implements IUserPreferenceService {
  constructor(
    private userPreferenceRepository: IUserPreferenceRepository,
    private transactionManager: TransactionManager,
  ) {}

  async findByUserId(
    userId: string,
    ctx?: RequestContext,
  ): Promise<UserPreferenceRecord | null> {
    return this.userPreferenceRepository.findByUserId(userId, ctx);
  }

  async setDefaultPortal(
    userId: string,
    defaultPortal: DefaultPortal,
    ctx?: RequestContext,
  ): Promise<UserPreferenceRecord> {
    if (ctx?.tx) {
      return this.setDefaultPortalInternal(userId, defaultPortal, ctx);
    }
    return this.transactionManager.run((tx) =>
      this.setDefaultPortalInternal(userId, defaultPortal, { tx }),
    );
  }

  private async setDefaultPortalInternal(
    userId: string,
    defaultPortal: DefaultPortal,
    ctx: RequestContext,
  ): Promise<UserPreferenceRecord> {
    const preference = await this.userPreferenceRepository.upsert(
      { userId, defaultPortal },
      ctx,
    );

    logger.info(
      {
        event: "user_preference.default_portal_set",
        userId,
        defaultPortal,
      },
      "User default portal set",
    );

    return preference;
  }
}
