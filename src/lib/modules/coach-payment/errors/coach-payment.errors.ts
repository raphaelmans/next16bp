import {
  BusinessRuleError,
  ConflictError,
  NotFoundError,
} from "@/lib/shared/kernel/errors";

export class CoachPaymentMethodNotFoundError extends NotFoundError {
  constructor(id: string) {
    super(`Coach payment method not found: ${id}`);
  }
}

export class CoachPaymentMethodConflictError extends ConflictError {
  constructor(details: string) {
    super(`Coach payment method conflict: ${details}`);
  }
}

export class CoachPaymentMethodInactiveError extends BusinessRuleError {
  constructor() {
    super("Default payment method must be active");
  }
}
