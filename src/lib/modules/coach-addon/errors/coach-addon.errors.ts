import { BusinessRuleError, ConflictError } from "@/lib/shared/kernel/errors";

export class CoachAddonOverlapError extends ConflictError {
  readonly code = "COACH_ADDON_OVERLAP";

  constructor(coachId: string, addonLabel: string, dayOfWeek: number) {
    super("Coach addon rules cannot overlap", {
      coachId,
      addonLabel,
      dayOfWeek,
    });
  }
}

export class CoachAddonValidationError extends BusinessRuleError {
  readonly code = "COACH_ADDON_VALIDATION";
}
