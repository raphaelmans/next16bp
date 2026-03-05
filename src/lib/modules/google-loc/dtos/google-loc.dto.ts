import { z } from "zod";

const coerceFiniteNumber = () =>
  z.preprocess((value) => {
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.trim().length > 0) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : value;
    }
    return value;
  }, z.number().finite());

export const GoogleLocPreviewRequestSchema = z.object({
  url: z.string().trim().min(1),
});

export const GoogleLocSourceSchema = z.enum(["marker", "center"]);

export const GoogleLocPreviewResponseSchema = z.object({
  inputUrl: z.string(),
  resolvedUrl: z.string().optional(),
  suggestedName: z.string().optional(),
  placeId: z.string().optional(),
  lat: z.number().finite().optional(),
  lng: z.number().finite().optional(),
  zoom: z.number().finite().optional(),
  source: GoogleLocSourceSchema.optional(),
  embedSrc: z.string().optional(),
  warnings: z.array(z.string()),
});

export const GoogleLocNearbyRequestSchema = z.object({
  lat: coerceFiniteNumber(),
  lng: coerceFiniteNumber(),
  radius: coerceFiniteNumber().optional(),
  max: coerceFiniteNumber().optional(),
});

export const GoogleLocNearbyPlaceSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const GoogleLocNearbyResponseSchema = z.object({
  places: z.array(GoogleLocNearbyPlaceSchema),
});

export type GoogleLocPreviewRequest = z.infer<
  typeof GoogleLocPreviewRequestSchema
>;
export type GoogleLocPreviewResponse = z.infer<
  typeof GoogleLocPreviewResponseSchema
>;
export type GoogleLocNearbyRequest = z.infer<
  typeof GoogleLocNearbyRequestSchema
>;
export type GoogleLocNearbyPlace = z.infer<typeof GoogleLocNearbyPlaceSchema>;
export type GoogleLocNearbyResponse = z.infer<
  typeof GoogleLocNearbyResponseSchema
>;

export const GoogleLocGeocodeRequestSchema = z.object({
  address: z.string().trim().min(1).max(200),
});

export const GoogleLocGeocodeResponseSchema = z.object({
  lat: z.number().finite(),
  lng: z.number().finite(),
  formattedAddress: z.string().optional(),
});

export type GoogleLocGeocodeRequest = z.infer<
  typeof GoogleLocGeocodeRequestSchema
>;
export type GoogleLocGeocodeResponse = z.infer<
  typeof GoogleLocGeocodeResponseSchema
>;
