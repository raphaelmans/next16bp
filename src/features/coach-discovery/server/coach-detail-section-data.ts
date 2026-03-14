import "server-only";

import { cache } from "react";
import { publicCaller } from "@/trpc/server";

const getCoachDetailsByIdOrSlugUncached = async (coachIdOrSlug: string) =>
  publicCaller.coach.getByIdOrSlug({ coachIdOrSlug });

const getCoachReviewsByCoachIdUncached = async (coachId: string) =>
  publicCaller.coachReview.list({ coachId, limit: 5, offset: 0 });

export const getCoachDetailsByIdOrSlugCached = cache(
  getCoachDetailsByIdOrSlugUncached,
);

export const getCoachReviewsByCoachIdCached = cache(
  getCoachReviewsByCoachIdUncached,
);

export type CoachDetailSectionData = Awaited<
  ReturnType<typeof getCoachDetailsByIdOrSlugCached>
>;

export async function getCoachCoreSectionData(coachIdOrSlug: string) {
  return getCoachDetailsByIdOrSlugCached(coachIdOrSlug);
}

export async function getCoachReviewSectionData(coachId: string) {
  return getCoachReviewsByCoachIdCached(coachId);
}
