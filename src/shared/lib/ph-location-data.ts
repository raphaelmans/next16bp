import type { PHProvinceCity } from "@/shared/lib/clients/ph-provinces-cities-client";

export type PHCity = PHProvinceCity;

export type PHProvince = PHCity & {
  cities: PHCity[];
};

const normalizeName = (value?: string | null) =>
  value
    ? value
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim()
    : "";

const normalizeCityName = (value?: string | null) => {
  const normalized = normalizeName(value);
  if (!normalized) return "";

  const withoutPrefix = normalized
    .replace(/^island garden city of\s+/, "")
    .replace(/^science city of\s+/, "")
    .replace(/^city of\s+/, "")
    .replace(/^municipality of\s+/, "");

  return withoutPrefix.replace(/\s+city$/, "").trim();
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
) => {
  const normalizedName = normalizeName(provinceName);
  if (!normalizedName) return undefined;

  return provinces.find((province) => {
    if (normalizeName(province.name) === normalizedName) return true;
    if (normalizeName(province.displayName) === normalizedName) return true;
    return normalizeName(province.slug) === normalizedName;
  });
};

export const findCityBySlug = (
  province?: PHProvince | null,
  citySlug?: string | null,
) => province?.cities.find((city: PHCity) => city.slug === citySlug);

export const findCityByName = (
  province?: PHProvince | null,
  cityName?: string | null,
) => {
  if (!province) return undefined;
  const normalizedName = normalizeCityName(cityName);
  if (!normalizedName) return undefined;

  return province.cities.find((city) => {
    if (normalizeCityName(city.name) === normalizedName) return true;
    if (normalizeCityName(city.displayName) === normalizedName) return true;
    return normalizeName(city.slug) === normalizedName;
  });
};

export const findCityBySlugAcrossProvinces = (
  provinces: PHProvince[],
  citySlug?: string | null,
) => findCityByKeyAcrossProvinces(provinces, "slug", citySlug);

export const findCityByNameAcrossProvinces = (
  provinces: PHProvince[],
  cityName?: string | null,
) => {
  if (!cityName) return null;

  for (const province of provinces) {
    const city = findCityByName(province, cityName);
    if (city) return { province, city };
  }

  return null;
};

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

export const resolveProvinceCityValues = (
  provinces: PHProvince[] | null | undefined,
  provinceName?: string | null,
  cityName?: string | null,
) => {
  const resolved = {
    province: provinceName ?? "",
    city: cityName ?? "",
  };

  if (!provinces) return resolved;

  const matchedProvince = findProvinceByName(provinces, provinceName);
  if (matchedProvince) {
    resolved.province = matchedProvince.name;
    const matchedCity = findCityByName(matchedProvince, cityName);
    if (matchedCity) {
      resolved.city = matchedCity.name;
      return resolved;
    }
  }

  if (cityName) {
    const acrossMatch = findCityByNameAcrossProvinces(provinces, cityName);
    if (acrossMatch) {
      if (!matchedProvince) {
        resolved.province = acrossMatch.province.name;
      }
      resolved.city = acrossMatch.city.name;
    }
  }

  return resolved;
};
