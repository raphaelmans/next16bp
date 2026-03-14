import { requireOwnedCoach } from "@/lib/modules/coach/helpers";
import type { ICoachRepository } from "@/lib/modules/coach/repositories/coach.repository";
import type { CoachPaymentMethodRecord } from "@/lib/shared/infra/db/schema";
import { logger } from "@/lib/shared/infra/logger";
import type { RequestContext } from "@/lib/shared/kernel/context";
import type { TransactionManager } from "@/lib/shared/kernel/transaction";
import type {
  CreateCoachPaymentMethodDTO,
  UpdateCoachPaymentMethodDTO,
} from "../dtos";
import {
  CoachPaymentMethodConflictError,
  CoachPaymentMethodInactiveError,
  CoachPaymentMethodNotFoundError,
} from "../errors/coach-payment.errors";
import type { ICoachPaymentMethodRepository } from "../repositories/coach-payment-method.repository";

export interface ICoachPaymentService {
  listMethods(
    userId: string,
    coachId: string,
  ): Promise<CoachPaymentMethodRecord[]>;
  createMethod(
    userId: string,
    data: CreateCoachPaymentMethodDTO,
  ): Promise<CoachPaymentMethodRecord>;
  updateMethod(
    userId: string,
    data: UpdateCoachPaymentMethodDTO,
  ): Promise<CoachPaymentMethodRecord>;
  deleteMethod(userId: string, paymentMethodId: string): Promise<void>;
  setDefaultMethod(userId: string, paymentMethodId: string): Promise<void>;
}

export class CoachPaymentService implements ICoachPaymentService {
  constructor(
    private coachRepository: ICoachRepository,
    private paymentMethodRepository: ICoachPaymentMethodRepository,
    private transactionManager: TransactionManager,
  ) {}

  private async assertCoachOwner(userId: string, coachId?: string) {
    return requireOwnedCoach({
      userId,
      coachId,
      findByUserId: (uid, ctx) => this.coachRepository.findByUserId(uid, ctx),
    });
  }

  async listMethods(userId: string, coachId: string) {
    const coach = await this.assertCoachOwner(userId, coachId);
    return this.paymentMethodRepository.findByCoachId(coach.id);
  }

  async createMethod(userId: string, data: CreateCoachPaymentMethodDTO) {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      const coach = await requireOwnedCoach({
        userId,
        coachId: data.coachId,
        findByUserId: (uid, c) => this.coachRepository.findByUserId(uid, c),
        ctx,
      });

      const existingMethods = await this.paymentMethodRepository.findByCoachId(
        coach.id,
        ctx,
      );

      const duplicate = existingMethods.find(
        (method) =>
          method.provider === data.provider &&
          method.accountNumber === data.accountNumber,
      );
      if (duplicate) {
        throw new CoachPaymentMethodConflictError(
          "Provider and account number already exist",
        );
      }

      const shouldBeDefault =
        data.isDefault ?? !existingMethods.some((method) => method.isDefault);

      if (shouldBeDefault && data.isActive === false) {
        throw new CoachPaymentMethodInactiveError();
      }

      if (shouldBeDefault) {
        await this.paymentMethodRepository.clearDefault(coach.id, ctx);
      }

      const created = await this.paymentMethodRepository.create(
        {
          coachId: coach.id,
          type: data.type,
          provider: data.provider,
          accountName: data.accountName,
          accountNumber: data.accountNumber,
          instructions: data.instructions ?? null,
          isActive: data.isActive ?? true,
          isDefault: shouldBeDefault,
        },
        ctx,
      );

      logger.info(
        {
          event: "coach_payment_method.created",
          coachId: coach.id,
          paymentMethodId: created.id,
          provider: created.provider,
          type: created.type,
        },
        "Coach payment method created",
      );

      return created;
    });
  }

  async updateMethod(userId: string, data: UpdateCoachPaymentMethodDTO) {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      const existing = await this.paymentMethodRepository.findById(
        data.paymentMethodId,
        ctx,
      );
      if (!existing) {
        throw new CoachPaymentMethodNotFoundError(data.paymentMethodId);
      }

      await requireOwnedCoach({
        userId,
        coachId: existing.coachId,
        findByUserId: (uid, c) => this.coachRepository.findByUserId(uid, c),
        ctx,
      });

      const methods = await this.paymentMethodRepository.findByCoachId(
        existing.coachId,
        ctx,
      );

      const provider = data.provider ?? existing.provider;
      const accountNumber = data.accountNumber ?? existing.accountNumber;
      const duplicate = methods.find(
        (method) =>
          method.id !== existing.id &&
          method.provider === provider &&
          method.accountNumber === accountNumber,
      );
      if (duplicate) {
        throw new CoachPaymentMethodConflictError(
          "Provider and account number already exist",
        );
      }

      const nextIsActive = data.isActive ?? existing.isActive;
      const wantsDefault = data.isDefault ?? existing.isDefault;

      if (wantsDefault && !nextIsActive) {
        throw new CoachPaymentMethodInactiveError();
      }

      if (data.isDefault) {
        await this.paymentMethodRepository.clearDefault(existing.coachId, ctx);
      }

      const updated = await this.paymentMethodRepository.update(
        existing.id,
        {
          type: data.type ?? existing.type,
          provider,
          accountName: data.accountName ?? existing.accountName,
          accountNumber,
          instructions:
            data.instructions === undefined
              ? existing.instructions
              : data.instructions,
          isActive: nextIsActive,
          isDefault: wantsDefault,
        },
        ctx,
      );

      if (existing.isDefault && !updated.isDefault) {
        await this.ensureDefaultMethod(existing.coachId, ctx);
      }

      logger.info(
        {
          event: "coach_payment_method.updated",
          coachId: existing.coachId,
          paymentMethodId: updated.id,
          fields: Object.keys(data),
        },
        "Coach payment method updated",
      );

      return updated;
    });
  }

  async deleteMethod(userId: string, paymentMethodId: string): Promise<void> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      const existing = await this.paymentMethodRepository.findById(
        paymentMethodId,
        ctx,
      );
      if (!existing) {
        throw new CoachPaymentMethodNotFoundError(paymentMethodId);
      }

      await requireOwnedCoach({
        userId,
        coachId: existing.coachId,
        findByUserId: (uid, c) => this.coachRepository.findByUserId(uid, c),
        ctx,
      });

      await this.paymentMethodRepository.delete(paymentMethodId, ctx);

      if (existing.isDefault) {
        await this.ensureDefaultMethod(existing.coachId, ctx);
      }

      logger.info(
        {
          event: "coach_payment_method.deleted",
          coachId: existing.coachId,
          paymentMethodId: paymentMethodId,
        },
        "Coach payment method deleted",
      );
    });
  }

  async setDefaultMethod(
    userId: string,
    paymentMethodId: string,
  ): Promise<void> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      const method = await this.paymentMethodRepository.findById(
        paymentMethodId,
        ctx,
      );
      if (!method) {
        throw new CoachPaymentMethodNotFoundError(paymentMethodId);
      }

      await requireOwnedCoach({
        userId,
        coachId: method.coachId,
        findByUserId: (uid, c) => this.coachRepository.findByUserId(uid, c),
        ctx,
      });

      if (!method.isActive) {
        throw new CoachPaymentMethodInactiveError();
      }

      await this.paymentMethodRepository.clearDefault(method.coachId, ctx);
      await this.paymentMethodRepository.update(
        method.id,
        { isDefault: true },
        ctx,
      );

      logger.info(
        {
          event: "coach_payment_method.default_set",
          coachId: method.coachId,
          paymentMethodId: method.id,
        },
        "Coach payment method set as default",
      );
    });
  }

  private async ensureDefaultMethod(coachId: string, ctx: RequestContext) {
    const methods = await this.paymentMethodRepository.findByCoachId(
      coachId,
      ctx,
    );
    const existingDefault = methods.find((method) => method.isDefault);
    if (existingDefault) {
      return;
    }

    const nextDefault = methods.find((method) => method.isActive);
    if (nextDefault) {
      await this.paymentMethodRepository.update(
        nextDefault.id,
        { isDefault: true },
        ctx,
      );
    }
  }
}
