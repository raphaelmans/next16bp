import { canonicalizeLeadUrl } from "./url-normalization";

export interface DiscoverySearchResult {
  url: string;
  title?: string | null;
  description?: string | null;
}

export function scoreDiscoverySearchResult(
  result: DiscoverySearchResult,
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

  let score = 0;

  if (haystack.includes(city)) score += 3;
  if (haystack.includes(province)) score += 2;
  if (haystack.includes(sport)) score += 4;

  const positiveKeywords = [
    "court",
    "courts",
    "book",
    "booking",
    "reserve",
    "reservation",
    "club",
    "sports center",
    "sports hub",
    "pickleball",
    "venue",
  ];

  for (const keyword of positiveKeywords) {
    if (haystack.includes(keyword)) {
      score += 1;
    }
  }

  const negativeKeywords = [
    "privacy",
    "terms",
    "about",
    "contact",
    "affiliate",
    "blog",
    "news",
    "policy",
  ];

  for (const keyword of negativeKeywords) {
    if (haystack.includes(keyword)) {
      score -= 3;
    }
  }

  const isLikelyVenueLead =
    score >= 6 &&
    !negativeKeywords.some((keyword) => haystack.includes(keyword));

  return {
    score,
    isLikelyVenueLead,
  };
}
