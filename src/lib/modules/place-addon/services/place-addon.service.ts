import { DEFAULT_CURRENCY } from "@/common/location-defaults";
import type { IOrganizationMemberService } from "@/lib/modules/organization-member/services/organization-member.service";
import {
  NotPlaceOwnerError,
  PlaceNotFoundError,
} from "@/lib/modules/place/errors/place.errors";
import type { IPlaceRepository } from "@/lib/modules/place/repositories/place.repository";
import type {
  PlaceAddonRateRuleRecord,
  PlaceAddonRecord,
} from "@/lib/shared/infra/db/schema";
import { logger } from "@/lib/shared/infra/logger";
import type { RequestContext } from "@/lib/shared/kernel/context";
import type { TransactionManager } from "@/lib/shared/kernel/transaction";
import type { SetPlaceAddonsDTO } from "../dtos";
import {
  PlaceAddonOverlapError,
  PlaceAddonValidationError,
} from "../errors/place-addon.errors";
import type { IPlaceAddonRepository } from "../repositories/place-addon.repository";

export interface PlaceAddonConfig {
  addon: PlaceAddonRecord;
  rules: PlaceAddonRateRuleRecord[];
}

export interface IPlaceAddonService {
  getByPlace(placeId: string): Promise<PlaceAddonConfig[]>;
  setForPlace(
    userId: string,
    data: SetPlaceAddonsDTO,
  ): Promise<PlaceAddonConfig[]>;
}

export class PlaceAddonService implements IPlaceAddonService {
  constructor(
    private placeAddonRepository: IPlaceAddonRepository,
    private placeRepository: IPlaceRepository,
    private organizationMemberService: IOrganizationMemberService,
    private transactionManager: TransactionManager,
  ) {}

  async getByPlace(placeId: string): Promise<PlaceAddonConfig[]> {
    const addons = await this.placeAddonRepository.findByPlaceId(placeId);
    if (addons.length === 0) return [];
    const rules = await this.placeAddonRepository.findRateRulesByAddonIds(
      addons.map((a) => a.id),
    );
    return addons.map((addon) => ({
      addon,
      rules: rules.filter((r) => r.addonId === addon.id),
    }));
  }

  async setForPlace(
    userId: string,
    data: SetPlaceAddonsDTO,
  ): Promise<PlaceAddonConfig[]> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      await this.verifyPlaceOwnership(userId, data.placeId, ctx);
      this.assertAddonPayloadValidity(data);

      await this.placeAddonRepository.deleteByPlaceId(data.placeId, ctx);

      const createdConfigs: PlaceAddonConfig[] = [];

      for (let index = 0; index < data.addons.length; index++) {
        const addonInput = data.addons[index];
        const createdAddon = await this.placeAddonRepository.createOne(
          {
            placeId: data.placeId,
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
          await this.placeAddonRepository.createManyRateRules(
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
          event: "place_addon.updated",
          placeId: data.placeId,
          userId,
          addonCount: createdConfigs.length,
        },
        "Place addons updated",
      );

      return createdConfigs;
    });
  }

  private async verifyPlaceOwnership(
    userId: string,
    placeId: string,
    ctx?: RequestContext,
  ): Promise<void> {
    const place = await this.placeRepository.findById(placeId, ctx);
    if (!place) {
      throw new PlaceNotFoundError(placeId);
    }

    if (!place.organizationId) {
      throw new NotPlaceOwnerError();
    }

    await this.organizationMemberService.assertOrganizationPermission(
      userId,
      place.organizationId,
      "place.manage",
      ctx,
    );
  }

  private assertAddonPayloadValidity(data: SetPlaceAddonsDTO): void {
    for (const addon of data.addons) {
      this.assertNoRuleOverlaps(data.placeId, addon.label, addon.rules);

      if (addon.pricingType === "HOURLY") {
        if (addon.rules.length === 0) {
          throw new PlaceAddonValidationError(
            "Hourly addons must include at least one rule",
            { placeId: data.placeId, addonLabel: addon.label },
          );
        }

        for (const rule of addon.rules) {
          if (rule.hourlyRateCents === undefined) {
            throw new PlaceAddonValidationError(
              "Hourly addon rules require hourlyRateCents",
              {
                placeId: data.placeId,
                addonLabel: addon.label,
                dayOfWeek: rule.dayOfWeek,
              },
            );
          }
        }
      }

      if (addon.pricingType === "FLAT") {
        if (addon.flatFeeCents === undefined) {
          throw new PlaceAddonValidationError(
            "Flat addons require flatFeeCents",
            { placeId: data.placeId, addonLabel: addon.label },
          );
        }
      }
    }
  }

  private assertNoRuleOverlaps(
    placeId: string,
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
          throw new PlaceAddonOverlapError(placeId, addonLabel, dayOfWeek);
        }
      }
    }
  }
}
