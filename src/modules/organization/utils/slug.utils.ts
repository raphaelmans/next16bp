/**
 * Generates a URL-friendly slug from a name.
 *
 * @param name - The name to convert to a slug
 * @returns URL-friendly slug (lowercase, alphanumeric with hyphens)
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

/**
 * Generates a unique slug by appending a counter if the slug already exists.
 *
 * @param name - The name to convert to a slug
 * @param checkExists - Function to check if a slug exists
 * @returns Unique slug (with -1, -2, etc. suffix if needed)
 */
export async function generateUniqueSlug(
  name: string,
  checkExists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const baseSlug = generateSlug(name);
  let slug = baseSlug;
  let counter = 1;

  while (await checkExists(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;

    // Safety limit to prevent infinite loops
    if (counter > 100) {
      // Use timestamp as ultimate fallback
      slug = `${baseSlug}-${Date.now()}`;
      break;
    }
  }

  return slug;
}
