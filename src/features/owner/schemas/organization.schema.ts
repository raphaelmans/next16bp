import { z } from "zod";

export const organizationSchema = z.object({
  name: z
    .string()
    .min(2, "Organization name must be at least 2 characters")
    .max(100, "Organization name must be less than 100 characters"),
  slug: z
    .string()
    .min(3, "URL slug must be at least 3 characters")
    .max(50, "URL slug must be less than 50 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "URL slug can only contain lowercase letters, numbers, and hyphens",
    ),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z
    .string()
    .regex(/^[0-9+\-() ]*$/, "Invalid phone number format")
    .optional()
    .or(z.literal("")),
  address: z
    .string()
    .max(200, "Address must be less than 200 characters")
    .optional(),
});

export type OrganizationFormData = z.infer<typeof organizationSchema>;

export const removalRequestSchema = z.object({
  reason: z
    .string()
    .min(10, "Please provide a more detailed reason (at least 10 characters)")
    .max(500, "Reason must be less than 500 characters"),
  acknowledgeReservations: z.boolean().refine((val) => val === true, {
    message: "You must acknowledge that pending reservations will be cancelled",
  }),
  acknowledgeApproval: z.boolean().refine((val) => val === true, {
    message: "You must acknowledge that this requires admin approval",
  }),
});

export type RemovalRequestFormData = z.infer<typeof removalRequestSchema>;
