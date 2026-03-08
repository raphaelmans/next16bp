import type {
  CuratedDuplicateCandidate,
  CuratedDuplicateCandidateMatch,
  CuratedDuplicateRow,
} from "@/lib/modules/place/curated-duplicate-checker";

const defaultRow = {
  country: "PH",
  facebookUrl: null,
  instagramUrl: null,
  viberInfo: null,
  websiteUrl: null,
} satisfies Omit<CuratedDuplicateRow, "name" | "address" | "city" | "province">;

const defaultCandidate = {
  country: "PH",
  facebookUrl: null,
  instagramUrl: null,
  phoneNumber: null,
  viberInfo: null,
  websiteUrl: null,
} satisfies Omit<
  CuratedDuplicateCandidate,
  "id" | "name" | "address" | "city" | "province"
>;

export function createRow(
  overrides: Partial<CuratedDuplicateRow> & {
    name: string;
    address: string;
    city: string;
    province: string;
  },
): CuratedDuplicateRow {
  return {
    ...defaultRow,
    ...overrides,
  };
}

export function createCandidate(
  overrides: Partial<CuratedDuplicateCandidate> & {
    id: string;
    name: string;
    address: string;
    city: string;
    province: string;
  },
): CuratedDuplicateCandidate {
  return {
    ...defaultCandidate,
    ...overrides,
  };
}

export function createMatch(
  overrides: Partial<CuratedDuplicateCandidateMatch> & {
    placeId: string;
    name: string;
    city: string;
    province: string;
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
  },
): CuratedDuplicateCandidateMatch {
  return {
    embeddingScore: null,
    ...overrides,
  };
}

export const exactNameCityProvinceFixture = {
  row: createRow({
    name: "Magnum Sports Complex",
    address: "8WM4+JW, San Miguel Rd, Apas, Cebu City, 6000 Cebu",
    city: "Cebu City",
    province: "Cebu",
  }),
  bestMatch: createMatch({
    placeId: "place-magnum",
    name: "Magnum Sports Complex",
    city: "CEBU CITY",
    province: "CEBU",
    embeddingScore: 0.919,
    lexicalScore: 0.95,
    totalScore: 0.933,
    sameCity: true,
    sameProvince: true,
    sameName: true,
    urlMatchCount: 0,
    phoneMatch: false,
    addressTokenScore: 0.7,
    nameTokenScore: 1,
    reason: "same normalized name + city + province",
  }),
};

export const sharedSocialFalsePositiveFixture = {
  row: createRow({
    name: "Fervent Academy Pickleball Court",
    address: "Basak, Mandaue",
    city: "Mandaue City",
    province: "Cebu",
    facebookUrl: "https://www.facebook.com/profile.php?id=61582557202059",
    viberInfo: "0998 594 0510",
    websiteUrl: "https://cebupickleballcourts.com/fervent-academy/",
  }),
  bestMatch: createMatch({
    placeId: "place-cordova",
    name: "Cordova Pickleball Court",
    city: "CORDOBA",
    province: "CEBU",
    embeddingScore: 0.751,
    lexicalScore: 0.42,
    totalScore: 0.602,
    sameCity: false,
    sameProvince: true,
    sameName: false,
    urlMatchCount: 1,
    phoneMatch: false,
    addressTokenScore: 0,
    nameTokenScore: 0.4,
    reason: "same social/website url",
  }),
};

export const sameBranchSocialFixture = {
  row: createRow({
    name: "Match Point Consolacion",
    address: "9XHF+65, Consolacion, Cebu",
    city: "Consolacion",
    province: "Cebu",
    facebookUrl: "https://www.facebook.com/matchpoint.cebu/",
    instagramUrl: "https://www.instagram.com/matchpoint.cebu",
    websiteUrl: "https://cebupickleballcourts.com/match-point-consolacion/",
  }),
  bestMatch: createMatch({
    placeId: "place-match-consolacion",
    name: "Match Point 2.0",
    city: "CONSOLACION",
    province: "CEBU",
    embeddingScore: 0.821,
    lexicalScore: 0.6,
    totalScore: 0.722,
    sameCity: true,
    sameProvince: true,
    sameName: false,
    urlMatchCount: 1,
    phoneMatch: false,
    addressTokenScore: 0.4,
    nameTokenScore: 0.4,
    reason: "same social/website url",
  }),
};

export const semanticReviewFixture = {
  row: createRow({
    name: "EVP Squared",
    address: "EVP Squared – Footprints Building Grounds – Upper Tabok",
    city: "Mandaue City",
    province: "Cebu",
    facebookUrl: "https://www.facebook.com/p2ekit2",
    viberInfo: "0942 532 1620",
  }),
  bestMatch: createMatch({
    placeId: "place-evp",
    name: "EVP Squared Footprints Pickleball Ground",
    city: "MANDAUE CITY",
    province: "CEBU",
    embeddingScore: 0.888,
    lexicalScore: 0.39,
    totalScore: 0.61,
    sameCity: true,
    sameProvince: true,
    sameName: false,
    urlMatchCount: 0,
    phoneMatch: false,
    addressTokenScore: 0.12,
    nameTokenScore: 0.25,
    reason: "low-signal candidate",
  }),
};

export const approvedLowSignalFixture = {
  row: createRow({
    name: "HillHouse Liloan",
    address: "3-983 Kapaz Street, Catarman, Liloan Cebu 6002",
    city: "Liloan",
    province: "Cebu",
    facebookUrl: "https://www.facebook.com/hillhouseburgersnwings/",
    viberInfo: "0917 156 1630",
  }),
  bestMatch: createMatch({
    placeId: "place-other",
    name: "Match Point - Badminton and Pickleball Court",
    city: "LILOAN",
    province: "CEBU",
    embeddingScore: 0.645,
    lexicalScore: 0.18,
    totalScore: 0.435,
    sameCity: true,
    sameProvince: true,
    sameName: false,
    urlMatchCount: 0,
    phoneMatch: false,
    addressTokenScore: 0.05,
    nameTokenScore: 0.1,
    reason: "low-signal candidate",
  }),
};
