import { readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import type { PHProvincesCities } from "@/shared/lib/clients/ph-provinces-cities-client";
import {
  findCityByName,
  findCityByNameAcrossProvinces,
  findCityBySlug,
  findProvinceByName,
  findProvinceBySlug,
} from "@/shared/lib/ph-location-data";

const locationsPath = path.join(
  process.cwd(),
  "public",
  "assets",
  "files",
  "ph-provinces-cities.enriched.min.json",
);

export const getPHProvincesCities = cache(
  async (): Promise<PHProvincesCities> => {
    const raw = await readFile(locationsPath, "utf-8");
    return JSON.parse(raw) as PHProvincesCities;
  },
);

export const resolveLocationSlugs = (
  provinces: PHProvincesCities,
  provinceValue?: string | null,
  cityValue?: string | null,
) => {
  const matchedProvince = provinceValue
    ? (findProvinceBySlug(provinces, provinceValue) ??
      findProvinceByName(provinces, provinceValue))
    : null;

  let matchedCity = cityValue
    ? matchedProvince
      ? (findCityBySlug(matchedProvince, cityValue) ??
        findCityByName(matchedProvince, cityValue))
      : null
    : null;

  let resolvedProvince = matchedProvince;

  if (!matchedCity && cityValue) {
    const acrossMatch = findCityByNameAcrossProvinces(provinces, cityValue);
    if (acrossMatch) {
      resolvedProvince = resolvedProvince ?? acrossMatch.province;
      matchedCity = acrossMatch.city;
    }
  }

  return {
    province: resolvedProvince,
    city: matchedCity,
    provinceSlug: resolvedProvince?.slug ?? null,
    citySlug: matchedCity?.slug ?? null,
  };
};
