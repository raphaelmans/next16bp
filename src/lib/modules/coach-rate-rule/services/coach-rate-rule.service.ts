import { DEFAULT_CURRENCY } from "@/common/location-defaults";
import { requireOwnedCoach } from "@/lib/modules/coach/helpers";
import type { ICoachRepository } from "@/lib/modules/coach/repositories/coach.repository";
import type { CoachRateRuleRecord } from "@/lib/shared/infra/db/schema";
import { logger } from "@/lib/shared/infra/logger";
import type { RequestContext } from "@/lib/shared/kernel/context";
import type { TransactionManager } from "@/lib/shared/kernel/transaction";
import type { SetCoachRateRulesDTO } from "../dtos";
import { CoachRateRuleOverlapError } from "../errors/coach-rate-rule.errors";
import type { ICoachRateRuleRepository } from "../repositories/coach-rate-rule.repository";

export interface ICoachRateRuleService {
  getRules(userId: string, coachId: string): Promise<CoachRateRuleRecord[]>;
  setRules(
    userId: string,
    data: SetCoachRateRulesDTO,
  ): Promise<CoachRateRuleRecord[]>;
}

export class CoachRateRuleService implements ICoachRateRuleService {
  constructor(
    private coachRateRuleRepository: ICoachRateRuleRepository,
    private coachRepository: ICoachRepository,
    private transactionManager: TransactionManager,
  ) {}

  async getRules(
    userId: string,
    coachId: string,
  ): Promise<CoachRateRuleRecord[]> {
    await requireOwnedCoach({
      userId,
      coachId,
      findByUserId: this.coachRepository.findByUserId.bind(
        this.coachRepository,
      ),
    });

    return this.coachRateRuleRepository.findByCoachId(coachId);
  }

  async setRules(
    userId: string,
    data: SetCoachRateRulesDTO,
  ): Promise<CoachRateRuleRecord[]> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      const ownedCoach = await requireOwnedCoach({
        userId,
        coachId: data.coachId,
        findByUserId: this.coachRepository.findByUserId.bind(
          this.coachRepository,
        ),
        ctx,
      });

      this.assertNoOverlaps(ownedCoach.id, data.rules);

      await this.coachRateRuleRepository.deleteByCoachId(ownedCoach.id, ctx);

      const created = await this.coachRateRuleRepository.createMany(
        data.rules.map((rule) => ({
          coachId: ownedCoach.id,
          dayOfWeek: rule.dayOfWeek,
          startMinute: rule.startMinute,
          endMinute: rule.endMinute,
          hourlyRateCents: rule.hourlyRateCents,
          currency: DEFAULT_CURRENCY,
        })),
        ctx,
      );

      logger.info(
        {
          event: "coach_rate_rule.updated",
          coachId: ownedCoach.id,
          userId,
          ruleCount: created.length,
        },
        "Coach rate rules updated",
      );

      return created;
    });
  }

  private assertNoOverlaps(
    coachId: string,
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
      for (let i = 1; i < sorted.length; i += 1) {
        if (sorted[i].startMinute < sorted[i - 1].endMinute) {
          throw new CoachRateRuleOverlapError(coachId, dayOfWeek);
        }
      }
    }
  }
}
