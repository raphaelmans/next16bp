import type { CoachRecord } from "@/lib/shared/infra/db/schema";
import type { RequestContext } from "@/lib/shared/kernel/context";
import { ValidationError } from "@/lib/shared/kernel/errors";
import { isUuid, normalizePlaceSlug } from "@/lib/slug";
import {
  CoachNotFoundError,
  CoachOwnershipError,
  CoachSlugConflictError,
} from "./errors/coach.errors";

type FindCoachBySlug = (
  slug: string,
  ctx?: RequestContext,
) => Promise<CoachRecord | null>;

type FindCoachByUserId = (
  userId: string,
  ctx?: RequestContext,
) => Promise<CoachRecord | null>;

interface ResolveCoachSlugOptions {
  rawSlug?: string | null;
  fallbackName: string;
  findBySlug: FindCoachBySlug;
  ctx?: RequestContext;
  excludeCoachId?: string;
}

export async function resolveCoachSlug({
  rawSlug,
  fallbackName,
  findBySlug,
  ctx,
  excludeCoachId,
}: ResolveCoachSlugOptions): Promise<string> {
  const baseInput = rawSlug?.trim() || fallbackName.trim();
  const normalized = normalizePlaceSlug(baseInput);

  if (!normalized || isUuid(normalized)) {
    throw new ValidationError("Coach slug is invalid", { slug: baseInput });
  }

  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const candidate =
      attempt === 0 ? normalized : `${normalized}-${attempt + 1}`;
    const existing = await findBySlug(candidate, ctx);
    if (!existing || existing.id === excludeCoachId) {
      return candidate;
    }
  }

  throw new CoachSlugConflictError(normalized);
}

interface RequireOwnedCoachOptions {
  userId: string;
  coachId?: string;
  findByUserId: FindCoachByUserId;
  ctx?: RequestContext;
}

export async function requireOwnedCoach({
  userId,
  coachId,
  findByUserId,
  ctx,
}: RequireOwnedCoachOptions): Promise<CoachRecord> {
  const existingCoach = await findByUserId(userId, ctx);

  if (!existingCoach) {
    throw new CoachNotFoundError(userId);
  }

  if (coachId && existingCoach.id !== coachId) {
    throw new CoachOwnershipError(coachId, userId);
  }

  return existingCoach;
}
