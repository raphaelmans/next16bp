import {
  CourtNotFoundError,
  CourtOrganizationMismatchError,
  NotCourtOwnerError,
} from "@/lib/modules/court/errors/court.errors";
import type { ICourtRepository } from "@/lib/modules/court/repositories/court.repository";
import type { IOrganizationRepository } from "@/lib/modules/organization/repositories/organization.repository";
import type { IPlaceRepository } from "@/lib/modules/place/repositories/place.repository";
import type { CourtRateRuleRecord } from "@/lib/shared/infra/db/schema";
import { logger } from "@/lib/shared/infra/logger";
import type { RequestContext } from "@/lib/shared/kernel/context";
import type { TransactionManager } from "@/lib/shared/kernel/transaction";
import type { SetCourtRateRulesDTO } from "../dtos";
import { CourtRateRuleOverlapError } from "../errors/court-rate-rule.errors";
import type { ICourtRateRuleRepository } from "../repositories/court-rate-rule.repository";

export interface ICourtRateRuleService {
  getRules(courtId: string): Promise<CourtRateRuleRecord[]>;
  setRules(
    userId: string,
    data: SetCourtRateRulesDTO,
  ): Promise<CourtRateRuleRecord[]>;
  copyFromCourt(
    userId: string,
    sourceCourtId: string,
    targetCourtId: string,
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

  private requireCourtPlaceId(placeId: string | null): string {
    if (!placeId) {
      throw new NotCourtOwnerError();
    }
    return placeId;
  }

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

  async copyFromCourt(
    userId: string,
    sourceCourtId: string,
    targetCourtId: string,
  ): Promise<CourtRateRuleRecord[]> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      const sourceCourt = await this.courtRepository.findById(
        sourceCourtId,
        ctx,
      );
      if (!sourceCourt) {
        throw new CourtNotFoundError(sourceCourtId);
      }

      const targetCourt = await this.courtRepository.findById(
        targetCourtId,
        ctx,
      );
      if (!targetCourt) {
        throw new CourtNotFoundError(targetCourtId);
      }

      await this.verifyCourtOwnership(userId, sourceCourtId, ctx);
      await this.verifyCourtOwnership(userId, targetCourtId, ctx);

      const sourcePlaceId = this.requireCourtPlaceId(sourceCourt.placeId);
      const targetPlaceId = this.requireCourtPlaceId(targetCourt.placeId);
      const sourcePlace = await this.placeRepository.findById(
        sourcePlaceId,
        ctx,
      );
      const targetPlace = await this.placeRepository.findById(
        targetPlaceId,
        ctx,
      );

      if (
        !sourcePlace?.organizationId ||
        !targetPlace?.organizationId ||
        sourcePlace.organizationId !== targetPlace.organizationId
      ) {
        throw new CourtOrganizationMismatchError();
      }

      const sourceRules = await this.courtRateRuleRepository.findByCourtId(
        sourceCourtId,
        ctx,
      );

      await this.courtRateRuleRepository.deleteByCourtId(targetCourtId, ctx);

      const created = await this.courtRateRuleRepository.createMany(
        sourceRules.map((rule) => ({
          courtId: targetCourtId,
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
          event: "court_rate_rule.copied",
          userId,
          sourceCourtId,
          targetCourtId,
          ruleCount: created.length,
        },
        "Court rate rules copied",
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
