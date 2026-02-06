import {
  AuthorizationError,
  BusinessRuleError,
  NotFoundError,
} from "@/lib/shared/kernel/errors";

export class SupportChatClaimRequestNotFoundError extends NotFoundError {
  readonly code = "SUPPORT_CHAT_CLAIM_REQUEST_NOT_FOUND";

  constructor(claimRequestId: string) {
    super("Claim request not found", { claimRequestId });
  }
}

export class SupportChatVerificationRequestNotFoundError extends NotFoundError {
  readonly code = "SUPPORT_CHAT_VERIFICATION_REQUEST_NOT_FOUND";

  constructor(placeVerificationRequestId: string) {
    super("Verification request not found", { placeVerificationRequestId });
  }
}

export class SupportChatNotAllowedError extends AuthorizationError {
  readonly code = "SUPPORT_CHAT_NOT_ALLOWED";

  constructor() {
    super("You are not allowed to access this support chat");
  }
}

export class SupportChatClaimRequestNotEligibleError extends BusinessRuleError {
  readonly code = "SUPPORT_CHAT_CLAIM_REQUEST_NOT_ELIGIBLE";

  constructor(claimRequestId: string) {
    super("Support chat is not available for this claim request", {
      claimRequestId,
    });
  }
}
