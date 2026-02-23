import { ValidationError } from "@/lib/shared/kernel/errors";

export class PlaceAddonOverlapError extends ValidationError {
  readonly code = "PLACE_ADDON_RATE_RULE_OVERLAP";

  constructor(placeId: string, addonLabel: string, dayOfWeek: number) {
    super("Place addon rule windows overlap", {
      placeId,
      addonLabel,
      dayOfWeek,
    });
  }
}

export class PlaceAddonValidationError extends ValidationError {
  readonly code = "PLACE_ADDON_VALIDATION_ERROR";
}
