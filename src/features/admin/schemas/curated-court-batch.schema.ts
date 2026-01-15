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

const photoUrlsSchema = z
  .string()
  .optional()
  .or(z.literal(""))
  .refine(
    (value) => {
      if (!value) return true;
      const urls = value
        .split(/[\n,]/)
        .map((entry) => entry.trim())
        .filter(Boolean);
      if (urls.length === 0) return true;
      return urls.every((url) => z.string().url().safeParse(url).success);
    },
    {
      message: "Photo URLs must be valid URLs",
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
  latitude: coordinateSchema,
  longitude: coordinateSchema,
  facebookUrl: optionalUrlSchema,
  instagramUrl: optionalUrlSchema,
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
  photoUrls: photoUrlsSchema,
  courts: z.array(courtSchema).min(1, "Add at least one court for this place"),
});

export const curatedCourtBatchSchema = z.object({
  courts: z.array(curatedCourtBatchItemSchema).min(1),
});

export type CuratedCourtBatchFormData = z.infer<typeof curatedCourtBatchSchema>;
