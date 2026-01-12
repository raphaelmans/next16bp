import { z } from "zod";

export const placeFormSchema = z.object({
  name: z.string().min(1, "Place name is required").max(200),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timeZone: z.string().min(1).default("Asia/Manila"),
  isActive: z.boolean().default(true),
});

export type PlaceFormData = z.infer<typeof placeFormSchema>;

export const defaultPlaceFormValues: Partial<PlaceFormData> = {
  timeZone: "Asia/Manila",
  isActive: true,
};

export const PLACE_CITIES = [
  "Metro Manila",
  "Makati",
  "Taguig",
  "Quezon City",
  "Cebu City",
  "Davao City",
];

export const PLACE_TIME_ZONES = [
  "Asia/Manila",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Seoul",
];
