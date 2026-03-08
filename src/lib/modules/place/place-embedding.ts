export const PLACE_EMBEDDING_MODEL = "text-embedding-3-small";
export const PLACE_EMBEDDING_DIMENSIONS = 1536;
export const PLACE_EMBEDDING_PURPOSE_DEDUPE = "dedupe";

type PlaceEmbeddingSource = {
  name: string;
  address: string;
  city: string;
  province: string;
  country: string;
  phoneNumber?: string | null;
  viberInfo?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  websiteUrl?: string | null;
};

function normalizeEmbeddingText(value: string | null | undefined): string {
  if (!value) return "";
  return value.replace(/\s+/g, " ").trim();
}

export function buildPlaceEmbeddingCanonicalText(
  input: PlaceEmbeddingSource,
): string {
  const parts = [
    `name: ${normalizeEmbeddingText(input.name)}`,
    `address: ${normalizeEmbeddingText(input.address)}`,
    `city: ${normalizeEmbeddingText(input.city)}`,
    `province: ${normalizeEmbeddingText(input.province)}`,
    `country: ${normalizeEmbeddingText(input.country)}`,
  ];

  const optionalParts = [
    ["phone", input.phoneNumber],
    ["viber", input.viberInfo],
    ["facebook", input.facebookUrl],
    ["instagram", input.instagramUrl],
    ["website", input.websiteUrl],
  ] as const;

  for (const [label, value] of optionalParts) {
    const normalized = normalizeEmbeddingText(value);
    if (normalized) {
      parts.push(`${label}: ${normalized}`);
    }
  }

  return parts.join("\n");
}
