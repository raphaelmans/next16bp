import {
  CourtNotFoundError,
  NotCourtOwnerError,
} from "@/modules/court/errors/court.errors";
import type { ICourtRepository } from "@/modules/court/repositories/court.repository";
import type { IOrganizationRepository } from "@/modules/organization/repositories/organization.repository";
import type { IPlaceRepository } from "@/modules/place/repositories/place.repository";
import type { CourtRateRuleRecord } from "@/shared/infra/db/schema";
import { logger } from "@/shared/infra/logger";
import type { RequestContext } from "@/shared/kernel/context";
import type { TransactionManager } from "@/shared/kernel/transaction";
import type { SetCourtRateRulesDTO } from "../dtos";
import { CourtRateRuleOverlapError } from "../errors/court-rate-rule.errors";
import type { ICourtRateRuleRepository } from "../repositories/court-rate-rule.repository";

export interface ICourtRateRuleService {
  getRules(courtId: string): Promise<CourtRateRuleRecord[]>;
  setRules(
    userId: string,
    data: SetCourtRateRulesDTO,
  ): Promise<CourtRateRuleRecord[]>;
}

export class CourtRateRuleService implements ICourtRateRuleService {
  constructor(
    private courtRateRuleRepository: ICourtRateRuleRepository,
    private courtRepository: ICourtRepository,
    private placeRepository: IPlaceRepository,
    private organizationRepository: IOrganizationRepository,
    private transactionManager: TransactionManager,
  ) {}

  async getRules(courtId: string): Promise<CourtRateRuleRecord[]> {
    return this.courtRateRuleRepository.findByCourtId(courtId);
  }

  async setRules(
    userId: string,
    data: SetCourtRateRulesDTO,
  ): Promise<CourtRateRuleRecord[]> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      await this.verifyCourtOwnership(userId, data.courtId, ctx);
      this.assertNoOverlaps(data.courtId, data.rules);

      await this.courtRateRuleRepository.deleteByCourtId(data.courtId, ctx);

      const created = await this.courtRateRuleRepository.createMany(
        data.rules.map((rule) => ({
          courtId: data.courtId,
          dayOfWeek: rule.dayOfWeek,
          startMinute: rule.startMinute,
          endMinute: rule.endMinute,
          currency: rule.currency,
          hourlyRateCents: rule.hourlyRateCents,
        })),
        ctx,
      );

      logger.info(
        {
          event: "court_rate_rule.updated",
          courtId: data.courtId,
          userId,
          ruleCount: created.length,
        },
        "Court rate rules updated",
      );

      return created;
    });
  }

  private async verifyCourtOwnership(
    userId: string,
    courtId: string,
    ctx?: RequestContext,
  ): Promise<void> {
    const court = await this.courtRepository.findById(courtId, ctx);
    if (!court) {
      throw new CourtNotFoundError(courtId);
    }

    const place = await this.placeRepository.findById(court.placeId, ctx);
    if (!place || !place.organizationId) {
      throw new NotCourtOwnerError();
    }

    const organization = await this.organizationRepository.findById(
      place.organizationId,
      ctx,
    );
    if (!organization || organization.ownerUserId !== userId) {
      throw new NotCourtOwnerError();
    }
  }

  private assertNoOverlaps(
    courtId: string,
    rules: { dayOfWeek: number; startMinute: number; endMinute: number }[],
  ): void {
    const byDay = new Map<
      number,
      { startMinute: number; endMinute: number }[]
    >();
    for (const rule of rules) {
      const list = byDay.get(rule.dayOfWeek) ?? [];
      list.push({ startMinute: rule.startMinute, endMinute: rule.endMinute });
      byDay.set(rule.dayOfWeek, list);
    }

    for (const [dayOfWeek, dayRules] of byDay.entries()) {
      const sorted = dayRules.sort((a, b) => a.startMinute - b.startMinute);
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].startMinute < sorted[i - 1].endMinute) {
          throw new CourtRateRuleOverlapError(courtId, dayOfWeek);
        }
      }
    }
  }
}
