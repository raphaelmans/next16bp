import { ValidationError } from "@/lib/shared/kernel/errors";

export class InvalidAvailabilityAddonSelectionError extends ValidationError {
  readonly code = "INVALID_AVAILABILITY_ADDON_SELECTION";

  constructor(details: {
    courtId?: string;
    placeId?: string;
    sportId?: string;
    invalidAddonIds: string[];
  }) {
    super(
      "One or more selected add-ons are not valid for this availability context.",
      details,
    );
  }
}
