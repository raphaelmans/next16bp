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
  let hostname = "";
  let pathname = "";

  try {
    const parsed = new URL(result.url);
    hostname = parsed.hostname.replace(/^www\./, "").toLowerCase();
    pathname = parsed.pathname.toLowerCase();
  } catch {}

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

  const isKnownStrongDomain =
    hostname.includes("pickleheads.com") ||
    hostname.includes("setmore.com") ||
    hostname.includes("court-access.com");

  const isStructuredListDomain = hostname.includes("playtimescheduler.com");

  if (isKnownStrongDomain) {
    score += 4;
  }

  if (isStructuredListDomain) {
    score += 2;
  }

  const isSocialDomain =
    hostname.includes("facebook.com") || hostname.includes("instagram.com");
  const isSocialPostLike =
    pathname.includes("/groups/") ||
    pathname.includes("/posts/") ||
    pathname.includes("/videos/") ||
    pathname.includes("/reel") ||
    pathname.includes("/p/");

  if (isSocialPostLike) {
    score -= 5;
  }

  const isNewsLike =
    hostname.includes("metropost") ||
    hostname.includes("news") ||
    hostname.includes("blog");
  if (isNewsLike) {
    score -= 4;
  }

  const isGenericCommunityPage =
    hostname.includes("reddit.com") ||
    hostname.includes("youtube.com") ||
    hostname.includes("tiktok.com") ||
    (!isStructuredListDomain && haystack.includes("find pickleball games"));
  if (isGenericCommunityPage) {
    score -= 4;
  }

  const isIndependentCandidate =
    !isKnownStrongDomain &&
    !isSocialDomain &&
    !isNewsLike &&
    !isGenericCommunityPage;

  if (
    isIndependentCandidate &&
    haystack.includes(sport) &&
    (haystack.includes(city) || haystack.includes(province))
  ) {
    score += 3;
  }

  const hasStableVenueSignal =
    isKnownStrongDomain ||
    isStructuredListDomain ||
    pathname.includes("/courts/") ||
    pathname.includes("/court/") ||
    pathname.includes("/club") ||
    pathname.includes("/sports") ||
    pathname.includes("/booking") ||
    title.includes("court") ||
    title.includes("courts") ||
    title.includes("club") ||
    title.includes("sports center") ||
    description.includes("court") ||
    description.includes("courts") ||
    description.includes("booking") ||
    description.includes("reservation");

  const isLikelyVenueLead =
    score >= 6 &&
    hasStableVenueSignal &&
    (!isSocialDomain || !isSocialPostLike) &&
    !negativeKeywords.some((keyword) => haystack.includes(keyword));

  return {
    score,
    isLikelyVenueLead,
  };
}
