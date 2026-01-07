import { z } from "zod";

export const courtFormSchema = z.object({
  // Basic Info
  name: z.string().min(1, "Court name is required").max(100),
  numberOfCourts: z.number().min(1).max(20).default(1),
  operatingHoursStart: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  operatingHoursEnd: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),

  // Location
  address: z.string().min(1, "Address is required").max(255),
  city: z.string().min(1, "City is required"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),

  // Photos
  photos: z.array(z.string().url()).max(10).default([]),

  // Amenities
  amenities: z.array(z.string()).default([]),
  customAmenities: z.array(z.string()).default([]),

  // Payment
  isFree: z.boolean().default(false),
  defaultHourlyRate: z.number().min(0).optional(),
  currency: z.string().default("PHP"),
  paymentInstructions: z.string().max(1000).optional(),
  gcashEnabled: z.boolean().default(false),
  gcashNumber: z.string().optional(),
  bankTransferEnabled: z.boolean().default(false),
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankAccountName: z.string().optional(),
});

export type CourtFormData = z.infer<typeof courtFormSchema>;

export const defaultCourtFormValues: Partial<CourtFormData> = {
  numberOfCourts: 1,
  operatingHoursStart: "06:00",
  operatingHoursEnd: "22:00",
  photos: [],
  amenities: [],
  customAmenities: [],
  isFree: false,
  currency: "PHP",
  gcashEnabled: false,
  bankTransferEnabled: false,
};

export const STANDARD_AMENITIES = [
  "Parking",
  "Restrooms",
  "Lights",
  "Showers",
  "Locker Rooms",
  "Equipment Rental",
  "Pro Shop",
  "Seating Area",
  "Food/Drinks",
  "Water Station",
  "First Aid",
  "Security",
];

export const CITIES = [
  "Metro Manila",
  "Cebu City",
  "Davao City",
  "Quezon City",
  "Makati",
  "Taguig",
  "Pasig",
  "Mandaluyong",
  "San Juan",
  "Muntinlupa",
  "Parañaque",
  "Las Piñas",
  "Pasay",
  "Caloocan",
  "Malabon",
  "Navotas",
  "Valenzuela",
];
