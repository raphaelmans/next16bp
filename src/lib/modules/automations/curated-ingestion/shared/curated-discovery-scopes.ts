import {
  getPHProvincesCities,
  resolveLocationSlugs,
} from "@/lib/shared/lib/ph-location-data.server";

export interface CuratedDiscoveryScopeConfig {
  provinceSlug: string;
  citySlug: string;
}

export interface ResolvedCuratedDiscoveryScope {
  sportSlug: string;
  provinceSlug: string;
  citySlug: string;
  provinceName: string;
  cityName: string;
}

export const CURATED_DISCOVERY_SCOPES = [
  {
    provinceSlug: "metro-manila",
    citySlug: "quezon-city",
  },
  {
    provinceSlug: "metro-manila",
    citySlug: "city-of-pasig",
  },
  {
    provinceSlug: "metro-manila",
    citySlug: "city-of-makati",
  },
  {
    provinceSlug: "metro-manila",
    citySlug: "city-of-paranaque",
  },
  {
    provinceSlug: "metro-manila",
    citySlug: "taguig",
  },
  {
    provinceSlug: "cebu",
    citySlug: "mandaue-city",
  },
  {
    provinceSlug: "cebu",
    citySlug: "talisay-city",
  },
  {
    provinceSlug: "davao-del-sur",
    citySlug: "davao-city",
  },
  {
    provinceSlug: "iloilo",
    citySlug: "iloilo-city",
  },
  {
    provinceSlug: "negros-oriental",
    citySlug: "dumaguete-city",
  },
] as const satisfies readonly CuratedDiscoveryScopeConfig[];

export const CURATED_DISCOVERY_DEFAULT_SPORT_SLUG = "pickleball";

export async function resolveCuratedDiscoveryScopeOrThrow(input: {
  sportSlug: string;
  provinceValue: string;
  cityValue: string;
}): Promise<ResolvedCuratedDiscoveryScope> {
  const provinces = await getPHProvincesCities();
  const normalizedProvinceInput = input.provinceValue.trim();
  const normalizedCityInput = input.cityValue.trim();
  const resolved = resolveLocationSlugs(
    provinces,
    normalizedProvinceInput,
    normalizedCityInput,
  );

  if (
    !resolved.province ||
    resolved.province.slug !== normalizedProvinceInput
  ) {
    throw new Error(
      `Unknown province "${input.provinceValue}". Use a canonical province slug from public/assets/files/ph-provinces-cities.enriched.min.json.`,
    );
  }

  if (!resolved.city) {
    throw new Error(
      `Unknown city "${input.cityValue}" for province "${resolved.province.slug}". Use a canonical city slug from public/assets/files/ph-provinces-cities.enriched.min.json.`,
    );
  }

  if (resolved.city.slug !== normalizedCityInput) {
    throw new Error(
      `Invalid scope "${input.provinceValue}" / "${input.cityValue}". Provide canonical values that exist together in public/assets/files/ph-provinces-cities.enriched.min.json.`,
    );
  }

  return {
    sportSlug: input.sportSlug.trim().toLowerCase(),
    provinceSlug: resolved.province.slug,
    citySlug: resolved.city.slug,
    provinceName: resolved.province.displayName,
    cityName: resolved.city.displayName,
  };
}

export async function resolveDefaultCuratedDiscoveryScopes() {
  const scopes: ResolvedCuratedDiscoveryScope[] = [];

  for (const scope of CURATED_DISCOVERY_SCOPES) {
    scopes.push(
      await resolveCuratedDiscoveryScopeOrThrow({
        sportSlug: CURATED_DISCOVERY_DEFAULT_SPORT_SLUG,
        provinceValue: scope.provinceSlug,
        cityValue: scope.citySlug,
      }),
    );
  }

  return scopes;
}
