const NON_PRODUCTION_SLUG_REGEX =
  /(^|[-_])(test|example|dummy|sample|staging|sandbox|tmp|qa|dev)([-_]|$)/i;

export function isLikelyNonProductionSlug(slug: string): boolean {
  return NON_PRODUCTION_SLUG_REGEX.test(slug);
}

export function isSeoIndexableSlug(slug: string): boolean {
  return !isLikelyNonProductionSlug(slug);
}
