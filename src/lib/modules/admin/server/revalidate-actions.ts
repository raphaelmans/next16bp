"use server";

import { z } from "zod";
import { requireAdminSession } from "@/lib/shared/infra/auth/server-session";
import {
  HOME_FEATURED_VENUES_CACHE_TAG,
  revalidateHomeFeaturedVenues,
} from "@/lib/shared/infra/cache/revalidate-home-featured-venues";

const RevalidateFeaturedVenuesInputSchema = z.object({
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
