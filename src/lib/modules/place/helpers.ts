import type { PlaceRecord } from "@/lib/shared/infra/db/schema";
import type { RequestContext } from "@/lib/shared/kernel/context";
import { isUuid, normalizePlaceSlug } from "@/lib/slug";
import {
  PlaceSlugInvalidError,
  PlaceSlugTakenError,
} from "./errors/place.errors";

type FindPlaceBySlug = (
  slug: string,
  ctx?: RequestContext,
) => Promise<PlaceRecord | null>;

interface ResolvePlaceSlugOptions {
  rawSlug?: string | null;
  fallbackName: string;
  findBySlug: FindPlaceBySlug;
  ctx?: RequestContext;
  excludePlaceId?: string;
}

export async function resolvePlaceSlug({
  rawSlug,
  fallbackName,
  findBySlug,
  ctx,
  excludePlaceId,
}: ResolvePlaceSlugOptions): Promise<string> {
  const baseInput = rawSlug?.trim() || fallbackName.trim();
  const normalized = normalizePlaceSlug(baseInput);
  if (!normalized || isUuid(normalized)) {
    throw new PlaceSlugInvalidError(baseInput);
  }

  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const candidate =
      attempt === 0 ? normalized : `${normalized}-${attempt + 1}`;
    const existing = await findBySlug(candidate, ctx);
    if (!existing || existing.id === excludePlaceId) {
      return candidate;
    }
  }

  throw new PlaceSlugTakenError(normalized);
}
