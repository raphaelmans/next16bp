import type { PHProvinceCity } from "@/shared/lib/clients/ph-provinces-cities-client";

export type PHCity = PHProvinceCity;

export type PHProvince = PHCity & {
  cities: PHCity[];
};

type LocationValueKey = "name" | "slug";

export const buildProvinceOptions = (
  provinces: PHProvince[],
  valueKey: LocationValueKey = "slug",
) =>
  provinces.map((province) => ({
    label: province.displayName,
    value: province[valueKey],
  }));

export const buildCityOptions = (
  province?: PHProvince,
  valueKey: LocationValueKey = "slug",
) =>
  province
    ? province.cities.map((city: PHCity) => ({
        label: city.displayName,
        value: city[valueKey],
      }))
    : [];

type LocationLookupKey = "name" | "slug";

export const findProvinceBySlug = (
  provinces: PHProvince[],
  provinceSlug?: string | null,
) => provinces.find((province) => province.slug === provinceSlug);

export const findProvinceByName = (
  provinces: PHProvince[],
  provinceName?: string | null,
) => provinces.find((province) => province.name === provinceName);

export const findCityBySlug = (
  province?: PHProvince | null,
  citySlug?: string | null,
) => province?.cities.find((city: PHCity) => city.slug === citySlug);

export const findCityByName = (
  province?: PHProvince | null,
  cityName?: string | null,
) => province?.cities.find((city: PHCity) => city.name === cityName);

export const findCityBySlugAcrossProvinces = (
  provinces: PHProvince[],
  citySlug?: string | null,
) => findCityByKeyAcrossProvinces(provinces, "slug", citySlug);

export const findCityByNameAcrossProvinces = (
  provinces: PHProvince[],
  cityName?: string | null,
) => findCityByKeyAcrossProvinces(provinces, "name", cityName);

const findCityByKeyAcrossProvinces = (
  provinces: PHProvince[],
  key: LocationLookupKey,
  value?: string | null,
) => {
  if (!value) return null;

  for (const province of provinces) {
    const city = province.cities.find((entry: PHCity) => entry[key] === value);
    if (city) return { province, city };
  }

  return null;
};
