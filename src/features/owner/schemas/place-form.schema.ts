import { z } from "zod";

export const placeFormSchema = z.object({
  name: z.string().min(1, "Place name is required").max(200),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required").max(100),
  province: z.string().min(1, "Province is required").max(100),
  country: z.string().length(2).default("PH"),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  timeZone: z.string().min(1).default("Asia/Manila"),
  isActive: z.boolean().default(true),
  websiteUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  facebookUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  instagramUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  viberInfo: z
    .string()
    .max(100, "Viber info must be less than 100 characters")
    .optional()
    .or(z.literal("")),
  otherContactInfo: z
    .string()
    .max(500, "Contact info must be less than 500 characters")
    .optional()
    .or(z.literal("")),
});

export type PlaceFormData = z.infer<typeof placeFormSchema>;

export const defaultPlaceFormValues: Partial<PlaceFormData> = {
  timeZone: "Asia/Manila",
  country: "PH",
  isActive: true,
};

export const PLACE_TIME_ZONES = [
  "Asia/Manila",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Seoul",
];
