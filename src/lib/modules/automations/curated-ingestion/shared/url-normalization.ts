export function normalizeLocationSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function canonicalizeLeadUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";

    const removableParams = [
      "fbclid",
      "gclid",
      "igshid",
      "ref",
      "ref_src",
      "source",
      "utm_campaign",
      "utm_content",
      "utm_medium",
      "utm_source",
      "utm_term",
    ];

    for (const key of removableParams) {
      parsed.searchParams.delete(key);
    }

    const sortedEntries = Array.from(parsed.searchParams.entries()).sort(
      ([a], [b]) => a.localeCompare(b),
    );
    parsed.search = "";
    for (const [key, value] of sortedEntries) {
      parsed.searchParams.append(key, value);
    }

    const isRootPath = parsed.pathname === "/";
    if (!isRootPath && parsed.pathname.endsWith("/")) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }

    parsed.hostname = parsed.hostname.replace(/^www\./, "").toLowerCase();
    return parsed.toString();
  } catch {
    return url.trim();
  }
}
