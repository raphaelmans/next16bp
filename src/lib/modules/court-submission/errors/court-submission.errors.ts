import {
  AuthorizationError,
  BusinessRuleError,
  NotFoundError,
  ValidationError,
} from "@/lib/shared/kernel/errors";

export class CourtSubmissionNotFoundError extends NotFoundError {
  readonly code = "COURT_SUBMISSION_NOT_FOUND";
  constructor(submissionId: string) {
    super("Submission not found", { submissionId });
  }
}

export class UserBannedFromSubmissionsError extends AuthorizationError {
  readonly code = "USER_BANNED_FROM_SUBMISSIONS";
  constructor() {
    super("You are not allowed to submit venues");
  }
}

export class DailySubmissionQuotaExceededError extends BusinessRuleError {
  readonly code = "DAILY_SUBMISSION_QUOTA_EXCEEDED";
  constructor() {
    super("You have reached the daily submission limit of 10 venues");
  }
}

export class SubmissionNotPendingError extends BusinessRuleError {
  readonly code = "SUBMISSION_NOT_PENDING";
  constructor(submissionId: string) {
    super("Submission is not in a reviewable state", { submissionId });
  }
}

export class SubmissionNotFoundError extends NotFoundError {
  readonly code = "SUBMISSION_NOT_FOUND";
  constructor() {
    super("No submission found for this venue");
  }
}

export class InvalidGoogleMapsLinkError extends ValidationError {
  readonly code = "INVALID_GOOGLE_MAPS_LINK";
  constructor() {
    super("Could not extract coordinates from the provided Google Maps link");
  }
}
