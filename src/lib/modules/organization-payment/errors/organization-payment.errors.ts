import {
  BusinessRuleError,
  ConflictError,
  NotFoundError,
} from "@/lib/shared/kernel/errors";

export class OrganizationPaymentMethodNotFoundError extends NotFoundError {
  constructor(id: string) {
    super(`Payment method not found: ${id}`);
  }
}

export class OrganizationPaymentMethodConflictError extends ConflictError {
  constructor(details: string) {
    super(`Payment method conflict: ${details}`);
  }
}

export class OrganizationPaymentMethodInactiveError extends BusinessRuleError {
  constructor() {
    super("Default payment method must be active");
  }
}
