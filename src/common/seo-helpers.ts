/**
 * Shared SEO helpers — pure, side-effect-free.
 * Used by venue and court metadata generators.
 */

/**
 * Convert a URL slug into a human-readable title.
 *
 * @example humanizeSlug("kusos-courts-complex") → "Kusos Courts Complex"
 */
export const humanizeSlug = (slug: string): string =>
  slug
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();

/**
 * Build a compact location label from city + province, falling back to address.
 */
export const buildLocationLabel = (place: {
  city: string;
  province: string;
  address: string;
}): string => {
  const parts = [place.city, place.province].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : place.address;
};
