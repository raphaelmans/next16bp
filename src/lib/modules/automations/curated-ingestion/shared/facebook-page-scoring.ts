import { canonicalizeLeadUrl } from "./url-normalization";

export interface FacebookLeadResult {
  url: string;
  title?: string | null;
  description?: string | null;
}

function isPageLikePath(pathname: string) {
  if (!pathname || pathname === "/") return false;
  if (pathname.includes("/groups/")) return false;
  if (pathname.includes("/posts/")) return false;
  if (pathname.includes("/videos/")) return false;
  if (pathname.includes("/reel")) return false;

  return (
    pathname.startsWith("/p/") ||
    pathname.startsWith("/people/") ||
    pathname.split("/").filter(Boolean).length === 1
  );
}

export function scoreFacebookPageLead(
  result: FacebookLeadResult,
  input: {
    city: string;
    province: string;
    sportSlug: string;
  },
) {
  const city = input.city.trim().toLowerCase();
  const province = input.province.trim().toLowerCase();
  const sport = input.sportSlug.trim().toLowerCase();
  const title = (result.title ?? "").toLowerCase();
  const description = (result.description ?? "").toLowerCase();
  const url = canonicalizeLeadUrl(result.url).toLowerCase();
  const haystack = `${title} ${description} ${url}`;

  let hostname = "";
  let pathname = "";
  try {
    const parsed = new URL(result.url);
    hostname = parsed.hostname.replace(/^www\./, "").toLowerCase();
    pathname = parsed.pathname.toLowerCase();
  } catch {}

  let score = 0;

  if (hostname.includes("facebook.com")) score += 2;
  if (haystack.includes(city)) score += 3;
  if (haystack.includes(province)) score += 2;
  if (haystack.includes(sport)) score += 4;
  if (haystack.includes("club")) score += 2;
  if (haystack.includes("court")) score += 2;
  if (haystack.includes("pickleball")) score += 2;

  const isLikelyPage = hostname.includes("facebook.com") && isPageLikePath(pathname);
  if (isLikelyPage) score += 3;

  return {
    score,
    isLikelyPageLead: isLikelyPage && score >= 8,
  };
}
