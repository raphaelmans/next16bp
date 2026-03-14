import { ValidationError } from "@/lib/shared/kernel/errors";

export class InvalidCoachAvailabilityAddonSelectionError extends ValidationError {
  readonly code = "INVALID_COACH_AVAILABILITY_ADDON_SELECTION";

  constructor(details: {
    coachId: string;
    invalidAddonIds: string[];
  }) {
    super(
      "One or more selected add-ons are not valid for this coach availability context.",
      details,
    );
  }
}
