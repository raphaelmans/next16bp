import { Redis } from "@upstash/redis";

const CACHE_PREFIX = "@kudoscourts/gplaceid/v1";
const NEGATIVE_SENTINEL = "__NONE__";
const POSITIVE_TTL_SECONDS = 60 * 60 * 24 * 90;
const NEGATIVE_TTL_SECONDS = 60 * 60 * 24;

type CacheLookup = {
  hit: boolean;
  placeId: string | null;
};

export type ResolveGooglePlaceIdResult = {
  placeId: string | null;
  source: "cache" | "api";
};

type ResolveGooglePlaceIdArgs = {
  apiKey: string;
  name: string;
  lat: number;
  lng: number;
};

let redisClient: Redis | null | undefined;

const getRedisClient = () => {
  if (redisClient !== undefined) return redisClient;
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    redisClient = null;
    return redisClient;
  }
  redisClient = Redis.fromEnv();
  return redisClient;
};

const normalizeName = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

const normalizeCoordinate = (value: number) => value.toFixed(6);

const buildCacheKeys = (args: { name: string; lat: number; lng: number }) => {
  const lat = normalizeCoordinate(args.lat);
  const lng = normalizeCoordinate(args.lng);
  const latLngKey = `${CACHE_PREFIX}/latlng/${lat},${lng}`;
  const nameKey = `${CACHE_PREFIX}/name/${normalizeName(args.name)}/latlng/${lat},${lng}`;
  return { latLngKey, nameKey };
};

const readCache = async (key: string): Promise<CacheLookup> => {
  const client = getRedisClient();
  if (!client) return { hit: false, placeId: null };

  try {
    const value = await client.get<string>(key);
    if (!value) return { hit: false, placeId: null };
    if (value === NEGATIVE_SENTINEL) {
      return { hit: true, placeId: null };
    }
    return { hit: true, placeId: value };
  } catch {
    return { hit: false, placeId: null };
  }
};

const writeCache = async (key: string, value: string | null) => {
  const client = getRedisClient();
  if (!client) return;

  const ttl = value ? POSITIVE_TTL_SECONDS : NEGATIVE_TTL_SECONDS;
  const payload = value ?? NEGATIVE_SENTINEL;

  try {
    await client.set(key, payload, { ex: ttl });
  } catch {
    // Cache is best-effort; ignore failures.
  }
};

const fetchPlaceIdFromGoogle = async (
  args: ResolveGooglePlaceIdArgs,
): Promise<string | null> => {
  const params = new URLSearchParams({
    input: args.name,
    inputtype: "textquery",
    fields: "place_id,name,geometry",
    locationbias: `circle:200@${args.lat},${args.lng}`,
    key: args.apiKey,
  });

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?${params.toString()}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    return null;
  }

  const json = (await response.json()) as {
    status?: string;
    candidates?: Array<{ place_id?: string; name?: string }>;
  };

  if (json.status !== "OK") {
    return null;
  }

  const candidate = json.candidates?.find((item) => Boolean(item.place_id));
  return candidate?.place_id ?? null;
};

export const resolveGooglePlaceId = async (
  args: ResolveGooglePlaceIdArgs,
): Promise<ResolveGooglePlaceIdResult> => {
  const trimmedName = args.name.trim();
  if (!trimmedName) {
    return { placeId: null, source: "api" };
  }

  const keys = buildCacheKeys(args);
  const cachedByName = await readCache(keys.nameKey);
  if (cachedByName.hit) {
    return { placeId: cachedByName.placeId, source: "cache" };
  }

  const cachedByLatLng = await readCache(keys.latLngKey);
  if (cachedByLatLng.hit) {
    return { placeId: cachedByLatLng.placeId, source: "cache" };
  }

  const placeId = await fetchPlaceIdFromGoogle({
    ...args,
    name: trimmedName,
  });

  await Promise.all([
    writeCache(keys.nameKey, placeId),
    writeCache(keys.latLngKey, placeId),
  ]);

  return { placeId, source: "api" };
};
