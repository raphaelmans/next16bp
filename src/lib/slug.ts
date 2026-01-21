import slug from "slug";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_SLUG_LENGTH = 200;

export function isUuid(value: string): boolean {
  return UUID_REGEX.test(value.trim());
}

export function normalizePlaceSlug(input: string): string {
  return slug(input, { lower: true, strict: true, trim: true }).slice(
    0,
    MAX_SLUG_LENGTH,
  );
}
