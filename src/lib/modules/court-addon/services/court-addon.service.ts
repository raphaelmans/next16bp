import {
  CourtNotFoundError,
  NotCourtOwnerError,
} from "@/lib/modules/court/errors/court.errors";
import type { ICourtRepository } from "@/lib/modules/court/repositories/court.repository";
import type { ICourtRateRuleRepository } from "@/lib/modules/court-rate-rule/repositories/court-rate-rule.repository";
import type { IOrganizationRepository } from "@/lib/modules/organization/repositories/organization.repository";
import type { IPlaceRepository } from "@/lib/modules/place/repositories/place.repository";
import type {
  CourtAddonRateRuleRecord,
  CourtAddonRecord,
} from "@/lib/shared/infra/db/schema";
import { logger } from "@/lib/shared/infra/logger";
import type { RequestContext } from "@/lib/shared/kernel/context";
import type { TransactionManager } from "@/lib/shared/kernel/transaction";
import type { SetCourtAddonsDTO } from "../dtos";
import {
  CourtAddonCurrencyMismatchError,
  CourtAddonOverlapError,
  CourtAddonValidationError,
} from "../errors/court-addon.errors";
import type { ICourtAddonRepository } from "../repositories/court-addon.repository";

export interface CourtAddonConfig {
  addon: CourtAddonRecord;
  rules: CourtAddonRateRuleRecord[];
}

export interface ICourtAddonService {
  getByCourt(courtId: string): Promise<CourtAddonConfig[]>;
  setForCourt(
    userId: string,
    data: SetCourtAddonsDTO,
  ): Promise<CourtAddonConfig[]>;
}

export class CourtAddonService implements ICourtAddonService {
  constructor(
    private courtAddonRepository: ICourtAddonRepository,
    private courtRateRuleRepository: ICourtRateRuleRepository,
    private courtRepository: ICourtRepository,
    private placeRepository: IPlaceRepository,
    private organizationRepository: IOrganizationRepository,
    private transactionManager: TransactionManager,
  ) {}

  async getByCourt(courtId: string): Promise<CourtAddonConfig[]> {
    const addons = await this.courtAddonRepository.findByCourtId(courtId);
    if (addons.length === 0) {
      return [];
    }
    const rules = await this.courtAddonRepository.findRateRulesByAddonIds(
      addons.map((addon) => addon.id),
    );
    return addons.map((addon) => ({
      addon,
      rules: rules.filter((rule) => rule.addonId === addon.id),
    }));
  }

  async setForCourt(
    userId: string,
    data: SetCourtAddonsDTO,
  ): Promise<CourtAddonConfig[]> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      await this.verifyCourtOwnership(userId, data.courtId, ctx);
      this.assertAddonPayloadValidity(data);
      await this.assertCurrencyCompatibility(data, ctx);

      await this.courtAddonRepository.deleteByCourtId(data.courtId, ctx);

      const createdConfigs: CourtAddonConfig[] = [];

      for (let index = 0; index < data.addons.length; index++) {
        const addonInput = data.addons[index];
        const createdAddon = await this.courtAddonRepository.createOne(
          {
            courtId: data.courtId,
            label: addonInput.label,
            isActive: addonInput.isActive ?? true,
            mode: addonInput.mode,
            pricingType: addonInput.pricingType,
            flatFeeCents: addonInput.flatFeeCents ?? null,
            flatFeeCurrency: addonInput.flatFeeCurrency ?? null,
            displayOrder: addonInput.displayOrder ?? index,
          },
          ctx,
        );

        const createdRules =
          await this.courtAddonRepository.createManyRateRules(
            addonInput.rules.map((rule) => ({
              addonId: createdAddon.id,
              dayOfWeek: rule.dayOfWeek,
              startMinute: rule.startMinute,
              endMinute: rule.endMinute,
              hourlyRateCents: rule.hourlyRateCents ?? null,
              currency: rule.currency ?? null,
            })),
            ctx,
          );

        createdConfigs.push({ addon: createdAddon, rules: createdRules });
      }

      logger.info(
        {
          event: "court_addon.updated",
          courtId: data.courtId,
          userId,
          addonCount: createdConfigs.length,
        },
        "Court addons updated",
      );

      return createdConfigs;
    });
  }

  private requireCourtPlaceId(placeId: string | null): string {
    if (!placeId) {
      throw new NotCourtOwnerError();
    }
    return placeId;
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

    const placeId = this.requireCourtPlaceId(court.placeId);
    const place = await this.placeRepository.findById(placeId, ctx);
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

  private assertAddonPayloadValidity(data: SetCourtAddonsDTO): void {
    for (const addon of data.addons) {
      this.assertNoRuleOverlaps(data.courtId, addon.label, addon.rules);

      if (addon.pricingType === "HOURLY") {
        if (addon.rules.length === 0) {
          throw new CourtAddonValidationError(
            "Hourly addons must include at least one rule",
            { courtId: data.courtId, addonLabel: addon.label },
          );
        }

        for (const rule of addon.rules) {
          if (rule.hourlyRateCents === undefined || !rule.currency) {
            throw new CourtAddonValidationError(
              "Hourly addon rules require hourlyRateCents and currency",
              {
                courtId: data.courtId,
                addonLabel: addon.label,
                dayOfWeek: rule.dayOfWeek,
              },
            );
          }
        }
      }

      if (addon.pricingType === "FLAT") {
        if (addon.flatFeeCents === undefined || !addon.flatFeeCurrency) {
          throw new CourtAddonValidationError(
            "Flat addons require flatFeeCents and flatFeeCurrency",
            { courtId: data.courtId, addonLabel: addon.label },
          );
        }

        for (const rule of addon.rules) {
          if (rule.hourlyRateCents !== undefined || rule.currency) {
            throw new CourtAddonValidationError(
              "Flat addon rules cannot include hourly pricing fields",
              {
                courtId: data.courtId,
                addonLabel: addon.label,
                dayOfWeek: rule.dayOfWeek,
              },
            );
          }
        }
      }
    }
  }

  private async assertCurrencyCompatibility(
    data: SetCourtAddonsDTO,
    ctx?: RequestContext,
  ): Promise<void> {
    const baseRules = await this.courtRateRuleRepository.findByCourtId(
      data.courtId,
      ctx,
    );

    if (baseRules.length === 0) {
      return;
    }

    const baseCurrencies = new Set(baseRules.map((rule) => rule.currency));
    for (const addon of data.addons) {
      const addonCurrencies = new Set<string>();

      if (addon.pricingType === "FLAT" && addon.flatFeeCurrency) {
        addonCurrencies.add(addon.flatFeeCurrency);
      }

      if (addon.pricingType === "HOURLY") {
        for (const rule of addon.rules) {
          if (rule.currency) {
            addonCurrencies.add(rule.currency);
          }
        }
      }

      for (const currency of addonCurrencies) {
        if (!baseCurrencies.has(currency)) {
          throw new CourtAddonCurrencyMismatchError(
            data.courtId,
            addon.label,
            currency,
          );
        }
      }
    }
  }

  private assertNoRuleOverlaps(
    courtId: string,
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
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].startMinute < sorted[i - 1].endMinute) {
          throw new CourtAddonOverlapError(courtId, addonLabel, dayOfWeek);
        }
      }
    }
  }
}
