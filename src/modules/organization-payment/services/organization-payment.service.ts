import {
  NotOrganizationOwnerError,
  OrganizationNotFoundError,
} from "@/modules/organization/errors/organization.errors";
import type { IOrganizationRepository } from "@/modules/organization/repositories/organization.repository";
import type { OrganizationPaymentMethodRecord } from "@/shared/infra/db/schema";
import { logger } from "@/shared/infra/logger";
import type { RequestContext } from "@/shared/kernel/context";
import type { TransactionManager } from "@/shared/kernel/transaction";
import type {
  CreateOrganizationPaymentMethodDTO,
  UpdateOrganizationPaymentMethodDTO,
} from "../dtos";
import {
  OrganizationPaymentMethodConflictError,
  OrganizationPaymentMethodInactiveError,
  OrganizationPaymentMethodNotFoundError,
} from "../errors/organization-payment.errors";
import type { IOrganizationPaymentMethodRepository } from "../repositories/organization-payment-method.repository";

export interface IOrganizationPaymentService {
  listMethods(
    userId: string,
    organizationId: string,
  ): Promise<OrganizationPaymentMethodRecord[]>;
  createMethod(
    userId: string,
    data: CreateOrganizationPaymentMethodDTO,
  ): Promise<OrganizationPaymentMethodRecord>;
  updateMethod(
    userId: string,
    data: UpdateOrganizationPaymentMethodDTO,
  ): Promise<OrganizationPaymentMethodRecord>;
  deleteMethod(userId: string, paymentMethodId: string): Promise<void>;
  setDefaultMethod(userId: string, paymentMethodId: string): Promise<void>;
}

export class OrganizationPaymentService implements IOrganizationPaymentService {
  constructor(
    private organizationRepository: IOrganizationRepository,
    private paymentMethodRepository: IOrganizationPaymentMethodRepository,
    private transactionManager: TransactionManager,
  ) {}

  private async assertOwner(
    userId: string,
    organizationId: string,
    ctx?: RequestContext,
  ) {
    const organization = await this.organizationRepository.findById(
      organizationId,
      ctx,
    );
    if (!organization) {
      throw new OrganizationNotFoundError(organizationId);
    }
    if (organization.ownerUserId !== userId) {
      throw new NotOrganizationOwnerError();
    }
  }

  async listMethods(userId: string, organizationId: string) {
    await this.assertOwner(userId, organizationId);
    return this.paymentMethodRepository.findByOrganizationId(organizationId);
  }

  async createMethod(userId: string, data: CreateOrganizationPaymentMethodDTO) {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      await this.assertOwner(userId, data.organizationId, ctx);

      const existingMethods =
        await this.paymentMethodRepository.findByOrganizationId(
          data.organizationId,
          ctx,
        );

      const duplicate = existingMethods.find(
        (method) =>
          method.provider === data.provider &&
          method.accountNumber === data.accountNumber,
      );
      if (duplicate) {
        throw new OrganizationPaymentMethodConflictError(
          "Provider and account number already exist",
        );
      }

      const shouldBeDefault =
        data.isDefault ?? !existingMethods.some((method) => method.isDefault);

      if (shouldBeDefault && data.isActive === false) {
        throw new OrganizationPaymentMethodInactiveError();
      }

      if (shouldBeDefault) {
        await this.paymentMethodRepository.clearDefault(
          data.organizationId,
          ctx,
        );
      }

      const created = await this.paymentMethodRepository.create(
        {
          organizationId: data.organizationId,
          type: data.type,
          provider: data.provider,
          accountName: data.accountName,
          accountNumber: data.accountNumber,
          instructions: data.instructions ?? null,
          isActive: data.isActive ?? true,
          isDefault: shouldBeDefault,
          displayOrder: data.displayOrder ?? 0,
        },
        ctx,
      );

      logger.info(
        {
          event: "organization_payment_method.created",
          organizationId: data.organizationId,
          paymentMethodId: created.id,
          provider: created.provider,
          type: created.type,
        },
        "Organization payment method created",
      );

      return created;
    });
  }

  async updateMethod(userId: string, data: UpdateOrganizationPaymentMethodDTO) {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      const existing = await this.paymentMethodRepository.findById(
        data.paymentMethodId,
        ctx,
      );
      if (!existing) {
        throw new OrganizationPaymentMethodNotFoundError(data.paymentMethodId);
      }

      await this.assertOwner(userId, existing.organizationId, ctx);

      const methods = await this.paymentMethodRepository.findByOrganizationId(
        existing.organizationId,
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
        throw new OrganizationPaymentMethodConflictError(
          "Provider and account number already exist",
        );
      }

      const nextIsActive = data.isActive ?? existing.isActive;
      const wantsDefault = data.isDefault ?? existing.isDefault;

      if (wantsDefault && !nextIsActive) {
        throw new OrganizationPaymentMethodInactiveError();
      }

      if (data.isDefault) {
        await this.paymentMethodRepository.clearDefault(
          existing.organizationId,
          ctx,
        );
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
          displayOrder: data.displayOrder ?? existing.displayOrder,
        },
        ctx,
      );

      if (existing.isDefault && !updated.isDefault) {
        await this.ensureDefaultMethod(existing.organizationId, ctx);
      }

      logger.info(
        {
          event: "organization_payment_method.updated",
          organizationId: existing.organizationId,
          paymentMethodId: updated.id,
          fields: Object.keys(data),
        },
        "Organization payment method updated",
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
        throw new OrganizationPaymentMethodNotFoundError(paymentMethodId);
      }

      await this.assertOwner(userId, existing.organizationId, ctx);

      await this.paymentMethodRepository.delete(paymentMethodId, ctx);

      if (existing.isDefault) {
        await this.ensureDefaultMethod(existing.organizationId, ctx);
      }

      logger.info(
        {
          event: "organization_payment_method.deleted",
          organizationId: existing.organizationId,
          paymentMethodId: paymentMethodId,
        },
        "Organization payment method deleted",
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
        throw new OrganizationPaymentMethodNotFoundError(paymentMethodId);
      }

      await this.assertOwner(userId, method.organizationId, ctx);

      if (!method.isActive) {
        throw new OrganizationPaymentMethodInactiveError();
      }

      await this.paymentMethodRepository.clearDefault(
        method.organizationId,
        ctx,
      );
      await this.paymentMethodRepository.update(
        method.id,
        { isDefault: true },
        ctx,
      );

      logger.info(
        {
          event: "organization_payment_method.default_set",
          organizationId: method.organizationId,
          paymentMethodId: method.id,
        },
        "Organization payment method set as default",
      );
    });
  }

  private async ensureDefaultMethod(
    organizationId: string,
    ctx: RequestContext,
  ) {
    const methods = await this.paymentMethodRepository.findByOrganizationId(
      organizationId,
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
