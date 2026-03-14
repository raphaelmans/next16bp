import "server-only";

import { cache } from "react";
import { publicCaller } from "@/trpc/server";

const getCoachDetailsByIdOrSlugUncached = async (coachIdOrSlug: string) =>
  publicCaller.coach.getByIdOrSlug({ coachIdOrSlug });

export const getCoachDetailsByIdOrSlugCached = cache(
  getCoachDetailsByIdOrSlugUncached,
);

export type CoachDetailSectionData = Awaited<
  ReturnType<typeof getCoachDetailsByIdOrSlugCached>
>;

export async function getCoachCoreSectionData(coachIdOrSlug: string) {
  return getCoachDetailsByIdOrSlugCached(coachIdOrSlug);
}
