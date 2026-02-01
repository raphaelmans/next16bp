"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { appRoutes } from "@/common/app-routes";
import { requireAdminSession } from "@/lib/shared/infra/auth/server-session";

const RevalidateHomeInputSchema = z.object({
  confirm: z.literal(true),
});

export async function revalidateHomeAction(input: { confirm: true }) {
  await requireAdminSession("/admin/tools/revalidate");

  const parsed = RevalidateHomeInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "Confirmation required",
    };
  }

  revalidatePath(appRoutes.index.base);
  revalidateTag("home:featured", "max");

  return {
    ok: true as const,
    path: appRoutes.index.base,
    tag: "home:featured",
    at: Date.now(),
  };
}
