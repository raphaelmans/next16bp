import { z } from "zod";

export const CITIES = [
  "Makati",
  "BGC",
  "Pasig",
  "Quezon City",
  "Manila",
  "Taguig",
  "Mandaluyong",
  "San Juan",
  "Parañaque",
  "Las Piñas",
  "Muntinlupa",
  "Alabang",
];

export const AMENITIES = [
  "Parking",
  "Restrooms",
  "Lights",
  "Showers",
  "Locker Rooms",
  "Equipment Rental",
  "Pro Shop",
  "Seating Area",
  "Food/Drinks",
  "WiFi",
  "Air Conditioning",
  "Covered Courts",
];

export const curatedCourtSchema = z.object({
  name: z
    .string()
    .min(3, "Court name must be at least 3 characters")
    .max(100, "Court name must be less than 100 characters"),
  address: z
    .string()
    .min(10, "Address must be at least 10 characters")
    .max(200, "Address must be less than 200 characters"),
  city: z.string().min(1, "City is required"),
  lat: z.number().optional(),
  lng: z.number().optional(),
  facebookUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  instagramUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  viberContact: z
    .string()
    .max(50, "Viber contact must be less than 50 characters")
    .optional()
    .or(z.literal("")),
  websiteUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  otherContactInfo: z
    .string()
    .max(500, "Contact info must be less than 500 characters")
    .optional(),
  amenities: z.array(z.string()),
});

export type CuratedCourtFormData = z.infer<typeof curatedCourtSchema>;
