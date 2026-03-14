import { ConflictError } from "@/lib/shared/kernel/errors";

export class CoachRateRuleOverlapError extends ConflictError {
  readonly code = "COACH_RATE_RULE_OVERLAP";

  constructor(coachId: string, dayOfWeek: number) {
    super("Coach rate rules cannot overlap", { coachId, dayOfWeek });
  }
}
