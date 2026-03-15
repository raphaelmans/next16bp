export type PlaceEnhancementFields = {
  websiteEnhancementStatus?: unknown;
  websiteEnhancementAttemptedAt?: unknown;
  websiteEnhancedAt?: unknown;
  websiteEnhancementError?: unknown;
  facebookEnhancementStatus?: unknown;
  facebookEnhancementAttemptedAt?: unknown;
  facebookEnhancedAt?: unknown;
  facebookEnhancementError?: unknown;
};

export type PlaceLocaleFields = {
  country?: string;
  timeZone?: string;
};

export type PlaceEnhancementFieldKey =
  | "websiteEnhancementStatus"
  | "websiteEnhancementAttemptedAt"
  | "websiteEnhancedAt"
  | "websiteEnhancementError"
  | "facebookEnhancementStatus"
  | "facebookEnhancementAttemptedAt"
  | "facebookEnhancedAt"
  | "facebookEnhancementError";

export type PlaceInternalFieldKey =
  | "country"
  | "timeZone"
  | PlaceEnhancementFieldKey;

export type PlaceRedactableRecord = PlaceLocaleFields & PlaceEnhancementFields;

export function redactPlaceEnhancementFields<T extends PlaceEnhancementFields>(
  place: T,
): Omit<T, PlaceEnhancementFieldKey> {
  const {
    websiteEnhancementStatus: _websiteEnhancementStatus,
    websiteEnhancementAttemptedAt: _websiteEnhancementAttemptedAt,
    websiteEnhancedAt: _websiteEnhancedAt,
    websiteEnhancementError: _websiteEnhancementError,
    facebookEnhancementStatus: _facebookEnhancementStatus,
    facebookEnhancementAttemptedAt: _facebookEnhancementAttemptedAt,
    facebookEnhancedAt: _facebookEnhancedAt,
    facebookEnhancementError: _facebookEnhancementError,
    ...rest
  } = place;

  return rest;
}

export function redactPlaceLocale<T extends PlaceRedactableRecord>(
  place: T,
): Omit<T, PlaceInternalFieldKey> {
  const {
    country: _country,
    timeZone: _timeZone,
    websiteEnhancementStatus: _websiteEnhancementStatus,
    websiteEnhancementAttemptedAt: _websiteEnhancementAttemptedAt,
    websiteEnhancedAt: _websiteEnhancedAt,
    websiteEnhancementError: _websiteEnhancementError,
    facebookEnhancementStatus: _facebookEnhancementStatus,
    facebookEnhancementAttemptedAt: _facebookEnhancementAttemptedAt,
    facebookEnhancedAt: _facebookEnhancedAt,
    facebookEnhancementError: _facebookEnhancementError,
    ...rest
  } = place;

  return rest;
}

export function redactPlaceDetailsLocale<
  T extends { place: PlaceRedactableRecord },
>(
  details: T,
): Omit<T, "place"> & { place: Omit<T["place"], PlaceInternalFieldKey> } {
  return {
    ...details,
    place: redactPlaceLocale(details.place),
  };
}
