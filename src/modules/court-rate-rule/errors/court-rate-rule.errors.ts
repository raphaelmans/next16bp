import { ValidationError } from "@/shared/kernel/errors";

export class CourtRateRuleOverlapError extends ValidationError {
  readonly code = "COURT_RATE_RULE_OVERLAP";

  constructor(courtId: string, dayOfWeek: number) {
    super("Court rate rules overlap", { courtId, dayOfWeek });
  }
}
