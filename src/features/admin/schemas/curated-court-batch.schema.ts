import { z } from "zod";

export { AMENITIES, CITIES } from "./curated-court.schema";

const optionalUrlSchema = z
  .string()
  .url("Invalid URL")
  .optional()
  .or(z.literal(""));

const courtSchema = z.object({
  label: z
    .string()
    .min(1, "Court label is required")
    .max(100, "Court label must be less than 100 characters"),
  sportId: z.string().uuid("Sport is required"),
  tierLabel: z
    .string()
    .max(20, "Tier label must be less than 20 characters")
    .optional()
    .nullable(),
});

const coordinateSchema = z
  .string()
  .optional()
  .or(z.literal(""))
  .refine(
    (value) =>
      value === undefined ||
      value === "" ||
      !Number.isNaN(Number.parseFloat(value)),
    {
      message: "Coordinate must be a valid decimal number",
    },
  );

export const curatedCourtBatchItemSchema = z.object({
  name: z
    .string()
    .min(3, "Court name must be at least 3 characters")
    .max(100, "Court name must be less than 100 characters"),
  address: z
    .string()
    .min(10, "Address must be at least 10 characters")
    .max(200, "Address must be less than 200 characters"),
  city: z.string().min(1, "City is required"),
  province: z.string().min(1, "Province is required").max(100),
  country: z.string().length(2),
  latitude: coordinateSchema,
  longitude: coordinateSchema,
  extGPlaceId: z.string().max(128).optional().or(z.literal("")),
  facebookUrl: optionalUrlSchema,
  instagramUrl: optionalUrlSchema,
  phoneNumber: z
    .string()
    .max(20, "Phone number must be less than 20 characters")
    .optional()
    .or(z.literal("")),
  viberContact: z
    .string()
    .max(50, "Viber contact must be less than 50 characters")
    .optional()
    .or(z.literal("")),
  websiteUrl: optionalUrlSchema,
  otherContactInfo: z
    .string()
    .max(500, "Contact info must be less than 500 characters")
    .optional()
    .or(z.literal("")),
  amenities: z.array(z.string()),
  courts: z.array(courtSchema).min(1, "Add at least one court for this venue"),
});

export const curatedCourtBatchSchema = z.object({
  courts: z.array(curatedCourtBatchItemSchema).min(1),
});

export type CuratedCourtBatchFormData = z.infer<typeof curatedCourtBatchSchema>;
