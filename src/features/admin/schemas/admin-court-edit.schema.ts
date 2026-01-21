import { z } from "zod";

const optionalUrlSchema = z
  .string()
  .url("Invalid URL")
  .optional()
  .or(z.literal(""));

const optionalTextSchema = (maxLength: number) =>
  z.string().max(maxLength).optional().or(z.literal(""));

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

const courtSchema = z.object({
  id: z.string().uuid().optional(),
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

export const adminCourtEditSchema = z.object({
  name: z
    .string()
    .min(3, "Court name must be at least 3 characters")
    .max(100, "Court name must be less than 100 characters"),
  address: z
    .string()
    .min(10, "Address must be at least 10 characters")
    .max(200, "Address must be less than 200 characters"),
  province: z.string().min(1, "Province is required").max(100),
  city: z.string().min(1, "City is required"),
  country: z.string().length(2),
  latitude: coordinateSchema,
  longitude: coordinateSchema,
  timeZone: z.string().min(1).max(64).optional(),
  facebookUrl: optionalUrlSchema,
  instagramUrl: optionalUrlSchema,
  phoneNumber: optionalTextSchema(20),
  viberInfo: optionalTextSchema(100),
  websiteUrl: optionalUrlSchema,
  otherContactInfo: optionalTextSchema(500),
  amenities: z.array(z.string()),
  courts: z.array(courtSchema).min(1, "Add at least one court"),
});

export type AdminCourtEditFormData = z.infer<typeof adminCourtEditSchema>;
