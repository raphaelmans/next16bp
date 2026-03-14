import { z } from "zod";

export const InviteCoachToVenueSchema = z.object({
  coachId: z.string().uuid(),
  placeId: z.string().uuid(),
});

export const CoachVenueIdSchema = z.object({
  coachVenueId: z.string().uuid(),
});

export const ListCoachVenuesByPlaceSchema = z.object({
  placeId: z.string().uuid(),
});

export type InviteCoachToVenueDTO = z.infer<typeof InviteCoachToVenueSchema>;
export type CoachVenueIdDTO = z.infer<typeof CoachVenueIdSchema>;
export type ListCoachVenuesByPlaceDTO = z.infer<
  typeof ListCoachVenuesByPlaceSchema
>;
