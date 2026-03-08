import { z } from "zod";
import { S } from "@/common/schemas";

export const UpsertPlaceReviewSchema = z.object({
  placeId: S.ids.placeId,
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().max(2000).optional(),
});

export const RemovePlaceReviewSchema = z.object({
  reviewId: S.ids.generic,
});

export const ListPlaceReviewsSchema = z.object({
  placeId: S.ids.placeId,
  limit: S.pagination.limit.default(20),
  offset: S.pagination.offset.default(0),
});

export const GetPlaceReviewAggregateSchema = z.object({
  placeId: S.ids.placeId,
});

export const GetViewerReviewSchema = z.object({
  placeId: S.ids.placeId,
});

export const AdminListPlaceReviewsSchema = z.object({
  placeId: S.ids.placeId.optional(),
  authorUserId: S.ids.generic.optional(),
  status: z.enum(["active", "removed"]).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  limit: S.pagination.limit.default(20),
  offset: S.pagination.offset.default(0),
});

export const AdminRemovePlaceReviewSchema = z.object({
  reviewId: S.ids.generic,
  reason: z.string().trim().max(500).optional(),
});

export type UpsertPlaceReviewDTO = z.infer<typeof UpsertPlaceReviewSchema>;
export type RemovePlaceReviewDTO = z.infer<typeof RemovePlaceReviewSchema>;
export type ListPlaceReviewsDTO = z.infer<typeof ListPlaceReviewsSchema>;
export type AdminListPlaceReviewsDTO = z.infer<
  typeof AdminListPlaceReviewsSchema
>;
export type AdminRemovePlaceReviewDTO = z.infer<
  typeof AdminRemovePlaceReviewSchema
>;
