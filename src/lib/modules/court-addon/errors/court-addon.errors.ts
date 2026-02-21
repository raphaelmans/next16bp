import { ValidationError } from "@/lib/shared/kernel/errors";

export class CourtAddonOverlapError extends ValidationError {
  readonly code = "COURT_ADDON_RATE_RULE_OVERLAP";

  constructor(courtId: string, addonLabel: string, dayOfWeek: number) {
    super("Court addon rule windows overlap", {
      courtId,
      addonLabel,
      dayOfWeek,
    });
  }
}

export class CourtAddonValidationError extends ValidationError {
  readonly code = "COURT_ADDON_VALIDATION_ERROR";
}

export class CourtAddonCurrencyMismatchError extends ValidationError {
  readonly code = "COURT_ADDON_CURRENCY_MISMATCH";

  constructor(courtId: string, addonLabel: string, currency: string) {
    super("Addon currency must match base pricing currency", {
      courtId,
      addonLabel,
      currency,
    });
  }
}
