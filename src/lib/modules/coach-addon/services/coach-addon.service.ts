import { DEFAULT_CURRENCY } from "@/common/location-defaults";
import { requireOwnedCoach } from "@/lib/modules/coach/helpers";
import type { ICoachRepository } from "@/lib/modules/coach/repositories/coach.repository";
import type {
  CoachAddonRateRuleRecord,
  CoachAddonRecord,
} from "@/lib/shared/infra/db/schema";
import { logger } from "@/lib/shared/infra/logger";
import type { RequestContext } from "@/lib/shared/kernel/context";
import type { TransactionManager } from "@/lib/shared/kernel/transaction";
import type { SetCoachAddonsDTO } from "../dtos";
import {
  CoachAddonOverlapError,
  CoachAddonValidationError,
} from "../errors/coach-addon.errors";
import type { ICoachAddonRepository } from "../repositories/coach-addon.repository";

export interface CoachAddonConfig {
  addon: CoachAddonRecord;
  rules: CoachAddonRateRuleRecord[];
}

export interface ICoachAddonService {
  getByCoach(userId: string, coachId: string): Promise<CoachAddonConfig[]>;
  setForCoach(
    userId: string,
    data: SetCoachAddonsDTO,
  ): Promise<CoachAddonConfig[]>;
}

export class CoachAddonService implements ICoachAddonService {
  constructor(
    private coachAddonRepository: ICoachAddonRepository,
    private coachRepository: ICoachRepository,
    private transactionManager: TransactionManager,
  ) {}

  async getByCoach(
    userId: string,
    coachId: string,
  ): Promise<CoachAddonConfig[]> {
    await requireOwnedCoach({
      userId,
      coachId,
      findByUserId: this.coachRepository.findByUserId.bind(
        this.coachRepository,
      ),
    });

    const addons = await this.coachAddonRepository.findByCoachId(coachId);
    if (addons.length === 0) {
      return [];
    }

    const rules = await this.coachAddonRepository.findRateRulesByAddonIds(
      addons.map((addon) => addon.id),
    );

    return addons.map((addon) => ({
      addon,
      rules: rules.filter((rule) => rule.addonId === addon.id),
    }));
  }

  async setForCoach(
    userId: string,
    data: SetCoachAddonsDTO,
  ): Promise<CoachAddonConfig[]> {
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

      this.assertAddonPayloadValidity(ownedCoach.id, data);

      await this.coachAddonRepository.deleteByCoachId(ownedCoach.id, ctx);

      const createdConfigs: CoachAddonConfig[] = [];

      for (let index = 0; index < data.addons.length; index += 1) {
        const addonInput = data.addons[index];
        const createdAddon = await this.coachAddonRepository.createOne(
          {
            coachId: ownedCoach.id,
            label: addonInput.label,
            isActive: addonInput.isActive ?? true,
            mode: addonInput.mode,
            pricingType: addonInput.pricingType,
            flatFeeCents: addonInput.flatFeeCents ?? null,
            flatFeeCurrency:
              addonInput.pricingType === "FLAT" ? DEFAULT_CURRENCY : null,
            displayOrder: addonInput.displayOrder ?? index,
          },
          ctx,
        );

        const createdRules =
          await this.coachAddonRepository.createManyRateRules(
            addonInput.rules.map((rule) => ({
              addonId: createdAddon.id,
              dayOfWeek: rule.dayOfWeek,
              startMinute: rule.startMinute,
              endMinute: rule.endMinute,
              hourlyRateCents: rule.hourlyRateCents ?? null,
              currency:
                addonInput.pricingType === "HOURLY" ? DEFAULT_CURRENCY : null,
            })),
            ctx,
          );

        createdConfigs.push({ addon: createdAddon, rules: createdRules });
      }

      logger.info(
        {
          event: "coach_addon.updated",
          coachId: ownedCoach.id,
          userId,
          addonCount: createdConfigs.length,
        },
        "Coach addons updated",
      );

      return createdConfigs;
    });
  }

  private assertAddonPayloadValidity(
    coachId: string,
    data: SetCoachAddonsDTO,
  ): void {
    for (const addon of data.addons) {
      this.assertNoRuleOverlaps(coachId, addon.label, addon.rules);

      if (addon.pricingType === "HOURLY") {
        if (addon.rules.length === 0) {
          throw new CoachAddonValidationError(
            "Hourly addons must include at least one rule",
            { coachId, addonLabel: addon.label },
          );
        }

        for (const rule of addon.rules) {
          if (rule.hourlyRateCents === undefined) {
            throw new CoachAddonValidationError(
              "Hourly addon rules require hourlyRateCents",
              { coachId, addonLabel: addon.label, dayOfWeek: rule.dayOfWeek },
            );
          }
        }
      }

      if (addon.pricingType === "FLAT") {
        if (addon.flatFeeCents === undefined) {
          throw new CoachAddonValidationError(
            "Flat addons require flatFeeCents",
            {
              coachId,
              addonLabel: addon.label,
            },
          );
        }

        for (const rule of addon.rules) {
          if (rule.hourlyRateCents !== undefined) {
            throw new CoachAddonValidationError(
              "Flat addon rules cannot include hourly pricing fields",
              { coachId, addonLabel: addon.label, dayOfWeek: rule.dayOfWeek },
            );
          }
        }
      }
    }
  }

  private assertNoRuleOverlaps(
    coachId: string,
    addonLabel: string,
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
          throw new CoachAddonOverlapError(coachId, addonLabel, dayOfWeek);
        }
      }
    }
  }
}
