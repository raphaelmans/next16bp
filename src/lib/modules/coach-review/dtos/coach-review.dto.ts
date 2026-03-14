import { z } from "zod";
import { S } from "@/common/schemas";

export const UpsertCoachReviewSchema = z.object({
  coachId: S.ids.coachId,
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().max(2000).optional(),
});

export const RemoveCoachReviewSchema = z.object({
  reviewId: S.ids.generic,
});

export const ListCoachReviewsSchema = z.object({
  coachId: S.ids.coachId,
  limit: S.pagination.limit.default(20),
  offset: S.pagination.offset.default(0),
});

export const GetCoachReviewAggregateSchema = z.object({
  coachId: S.ids.coachId,
});

export const GetCoachViewerReviewSchema = z.object({
  coachId: S.ids.coachId,
});

export const GetCoachReviewEligibilitySchema = z.object({
  coachId: S.ids.coachId,
});

export type UpsertCoachReviewDTO = z.infer<typeof UpsertCoachReviewSchema>;
export type RemoveCoachReviewDTO = z.infer<typeof RemoveCoachReviewSchema>;
export type ListCoachReviewsDTO = z.infer<typeof ListCoachReviewsSchema>;
export type GetCoachReviewEligibilityDTO = z.infer<
  typeof GetCoachReviewEligibilitySchema
>;
