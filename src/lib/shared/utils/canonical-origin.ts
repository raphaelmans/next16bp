const DEFAULT_CANONICAL_ORIGIN = "https://kudoscourts.ph";

export function getCanonicalOrigin(): string {
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!configuredOrigin) {
    return DEFAULT_CANONICAL_ORIGIN;
  }
  const normalizedOrigin = configuredOrigin.endsWith("/")
    ? configuredOrigin.slice(0, -1)
    : configuredOrigin;
  try {
    const hostname = new URL(normalizedOrigin).hostname.toLowerCase();
    if (hostname === "kudoscourts.com" || hostname === "www.kudoscourts.com") {
      return DEFAULT_CANONICAL_ORIGIN;
    }
  } catch {
    return DEFAULT_CANONICAL_ORIGIN;
  }
  return normalizedOrigin;
}

export function buildCanonicalUrl(path: string): string {
  return new URL(path, getCanonicalOrigin()).toString();
}
