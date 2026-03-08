export type CuratedDuplicateRow = {
  name: string;
  address: string;
  city: string;
  province: string;
  country: string;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  viberInfo?: string | null;
  websiteUrl?: string | null;
};

export type CuratedDuplicateCandidate = {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  country: string;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  phoneNumber?: string | null;
  viberInfo?: string | null;
  websiteUrl?: string | null;
};

export type CuratedDuplicateCandidateMatch = {
  placeId: string;
  name: string;
  city: string;
  province: string;
  embeddingScore: number | null;
  lexicalScore: number;
  totalScore: number;
  sameCity: boolean;
  sameProvince: boolean;
  sameName: boolean;
  urlMatchCount: number;
  phoneMatch: boolean;
  addressTokenScore: number;
  nameTokenScore: number;
  reason: string;
};

export type CuratedDuplicateDecisionStatus =
  | "approved"
  | "duplicate"
  | "review";

export function normalizeLoose(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(value: string | null | undefined): string[] {
  return normalizeLoose(value)
    .split(" ")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function jaccardScore(left: string[], right: string[]): number {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  if (leftSet.size === 0 || rightSet.size === 0) return 0;

  let intersection = 0;
  for (const value of leftSet) {
    if (rightSet.has(value)) {
      intersection += 1;
    }
  }

  const union = new Set([...leftSet, ...rightSet]).size;
  if (union === 0) return 0;
  return intersection / union;
}

export function normalizeUrl(value: string | null | undefined): string {
  if (!value) return "";
  try {
    const parsed = new URL(value);
    parsed.hash = "";
    parsed.search = "";
    const hostname = parsed.hostname.replace(/^www\./, "").toLowerCase();
    const pathname = parsed.pathname.replace(/\/+$/, "").toLowerCase();
    return `${hostname}${pathname}`;
  } catch {
    return normalizeLoose(value);
  }
}

export function extractPhoneTokens(
  value: string | null | undefined,
): Set<string> {
  if (!value) return new Set();
  const matches = value.match(/\d{7,}/g) ?? [];
  return new Set(matches);
}

export function buildCuratedDuplicateKey(row: CuratedDuplicateRow): string {
  return [
    normalizeLoose(row.name),
    normalizeLoose(row.city),
    normalizeLoose(row.province),
  ].join("|");
}

export function computeCuratedDuplicateCandidateMatch(
  incoming: CuratedDuplicateRow,
  candidate: CuratedDuplicateCandidate,
  embeddingScore: number | null,
): CuratedDuplicateCandidateMatch {
  const normalizedIncomingName = normalizeLoose(incoming.name);
  const normalizedCandidateName = normalizeLoose(candidate.name);
  const normalizedIncomingCity = normalizeLoose(incoming.city);
  const normalizedCandidateCity = normalizeLoose(candidate.city);
  const normalizedIncomingProvince = normalizeLoose(incoming.province);
  const normalizedCandidateProvince = normalizeLoose(candidate.province);

  const nameTokens = tokenize(incoming.name);
  const candidateNameTokens = tokenize(candidate.name);
  const addressTokens = tokenize(incoming.address);
  const candidateAddressTokens = tokenize(candidate.address);

  const sameCity = normalizedIncomingCity === normalizedCandidateCity;
  const sameProvince =
    normalizedIncomingProvince === normalizedCandidateProvince;
  const sameName = normalizedIncomingName === normalizedCandidateName;
  const nameTokenScore = jaccardScore(nameTokens, candidateNameTokens);
  const addressTokenScore = jaccardScore(addressTokens, candidateAddressTokens);

  const incomingUrls = [
    normalizeUrl(incoming.facebookUrl),
    normalizeUrl(incoming.instagramUrl),
    normalizeUrl(incoming.websiteUrl),
  ].filter(Boolean);
  const candidateUrls = [
    normalizeUrl(candidate.facebookUrl),
    normalizeUrl(candidate.instagramUrl),
    normalizeUrl(candidate.websiteUrl),
  ].filter(Boolean);

  const urlMatchCount = incomingUrls.filter((url) =>
    candidateUrls.includes(url),
  ).length;

  const incomingPhones = extractPhoneTokens(incoming.viberInfo);
  const candidatePhones = new Set([
    ...extractPhoneTokens(candidate.phoneNumber),
    ...extractPhoneTokens(candidate.viberInfo),
  ]);
  const phoneMatch = Array.from(incomingPhones).some((value) =>
    candidatePhones.has(value),
  );

  const lexicalScore =
    nameTokenScore * 0.55 +
    addressTokenScore * 0.2 +
    (sameCity ? 0.1 : 0) +
    (sameProvince ? 0.1 : 0) +
    (sameName ? 0.15 : 0) +
    urlMatchCount * 0.1 +
    (phoneMatch ? 0.1 : 0);

  const totalScore =
    lexicalScore * 0.45 + Math.max(embeddingScore ?? 0, 0) * 0.55;

  let reason = "low-signal candidate";

  if (urlMatchCount > 0) {
    reason = "same social/website url";
  } else if (phoneMatch) {
    reason = "same phone/viber";
  } else if (sameName && sameCity && sameProvince) {
    reason = "same normalized name + city + province";
  } else if ((embeddingScore ?? 0) >= 0.93) {
    reason = "high embedding similarity";
  } else if (nameTokenScore >= 0.65 && sameProvince) {
    reason = "strong name overlap in same province";
  }

  return {
    placeId: candidate.id,
    name: candidate.name,
    city: candidate.city,
    province: candidate.province,
    embeddingScore,
    lexicalScore,
    totalScore,
    sameCity,
    sameProvince,
    sameName,
    urlMatchCount,
    phoneMatch,
    addressTokenScore,
    nameTokenScore,
    reason,
  };
}

export function classifyCuratedDuplicateRow(
  incoming: CuratedDuplicateRow,
  candidates: CuratedDuplicateCandidateMatch[],
  seenKeys: Set<string>,
): {
  status: CuratedDuplicateDecisionStatus;
  reason: string;
} {
  const key = buildCuratedDuplicateKey(incoming);

  if (seenKeys.has(key)) {
    return {
      status: "duplicate",
      reason: "duplicate row in source file",
    };
  }

  seenKeys.add(key);

  const best = candidates[0];
  if (!best) {
    return { status: "approved", reason: "no curated candidates found" };
  }

  if (
    best.urlMatchCount > 0 &&
    (best.sameCity ||
      best.sameName ||
      (best.sameProvince &&
        ((best.embeddingScore ?? 0) >= 0.86 || best.nameTokenScore >= 0.5)))
  ) {
    return { status: "duplicate", reason: "same social/website url" };
  }

  if (best.phoneMatch && best.sameProvince && best.nameTokenScore >= 0.2) {
    return { status: "duplicate", reason: "same phone/viber in same province" };
  }

  if (best.sameName && best.sameCity && best.sameProvince) {
    return {
      status: "duplicate",
      reason: "same normalized name + city + province",
    };
  }

  if (best.sameName && best.sameProvince && best.addressTokenScore >= 0.35) {
    return {
      status: "duplicate",
      reason: "same normalized name with overlapping address in same province",
    };
  }

  if ((best.embeddingScore ?? 0) >= 0.955) {
    return {
      status: "duplicate",
      reason: "very high embedding similarity",
    };
  }

  if (
    (best.embeddingScore ?? 0) >= 0.93 &&
    (best.sameProvince || best.sameCity) &&
    best.nameTokenScore >= 0.3
  ) {
    return {
      status: "duplicate",
      reason: "high embedding similarity with matching location/name signals",
    };
  }

  if (
    (best.embeddingScore ?? 0) >= 0.89 &&
    (best.urlMatchCount > 0 ||
      best.phoneMatch ||
      (best.sameProvince && best.addressTokenScore >= 0.35))
  ) {
    return {
      status: "duplicate",
      reason: "embedding similarity confirmed by metadata/location",
    };
  }

  if (
    (best.embeddingScore ?? 0) >= 0.85 &&
    (best.sameProvince || best.sameCity || best.nameTokenScore >= 0.4)
  ) {
    return {
      status: "review",
      reason: "needs manual review due to semantic similarity",
    };
  }

  if (best.nameTokenScore >= 0.7 && best.sameProvince) {
    return {
      status: "review",
      reason: "needs manual review due to strong lexical overlap",
    };
  }

  if (best.urlMatchCount > 0 || best.phoneMatch) {
    return {
      status: "review",
      reason: "needs manual review due to shared metadata",
    };
  }

  return {
    status: "approved",
    reason: "no high-confidence duplicate signal",
  };
}
