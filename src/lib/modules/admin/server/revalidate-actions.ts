"use server";

import { z } from "zod";
import { requireAdminSession } from "@/lib/shared/infra/auth/server-session";
import {
  HOME_FEATURED_VENUES_CACHE_TAG,
  revalidateHomeFeaturedVenues,
} from "@/lib/shared/infra/cache/revalidate-home-featured-venues";
import {
  PUBLIC_COURTS_REVALIDATE_TARGETS,
  revalidatePublicCourtsPages,
} from "@/lib/shared/infra/cache/revalidate-public-courts-pages";

const RevalidateFeaturedVenuesInputSchema = z.object({
  confirm: z.literal(true),
});
const RevalidatePublicCourtsPagesInputSchema = z.object({
  confirm: z.literal(true),
});

export async function revalidateHomeFeaturedVenuesAction(input: {
  confirm: true;
}) {
  await requireAdminSession("/admin/tools/revalidate");

  const parsed = RevalidateFeaturedVenuesInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "Confirmation required",
    };
  }

  await revalidateHomeFeaturedVenues();

  return {
    ok: true as const,
    path: "/",
    tag: HOME_FEATURED_VENUES_CACHE_TAG,
    at: Date.now(),
  };
}

export async function revalidatePublicCourtsPagesAction(input: {
  confirm: true;
}) {
  await requireAdminSession("/admin/tools/revalidate");

  const parsed = RevalidatePublicCourtsPagesInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "Confirmation required",
    };
  }

  await revalidatePublicCourtsPages();

  return {
    ok: true as const,
    targets: PUBLIC_COURTS_REVALIDATE_TARGETS.map((target) =>
      target.type ? `${target.path} (${target.type})` : target.path,
    ),
    at: Date.now(),
  };
}
