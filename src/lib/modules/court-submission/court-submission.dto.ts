import { z } from "zod";
import { S } from "@/common/schemas";

const optionalUrl = z.string().trim().check(z.url()).optional();

export const SubmitCourtInputSchema = z
  .object({
    name: S.place.name,
    sportId: S.ids.sportId,
    city: S.place.city,
    province: S.place.province,
    locationMode: z.enum(["link", "manual"]),
    googleMapsLink: z.string().trim().check(z.url()).optional(),
    latitude: z.string().optional(),
    longitude: z.string().optional(),
    address: S.common.optionalText,
    amenities: z.array(S.place.amenity).optional(),
    facebookUrl: optionalUrl,
    instagramUrl: optionalUrl,
    phoneNumber: S.place.phoneNumber,
    viberInfo: S.place.viberInfo,
    websiteUrl: optionalUrl,
    otherContactInfo: S.place.otherContactInfo,
  })
  .refine(
    (data) => {
      if (data.locationMode === "link") {
        return !!data.googleMapsLink;
      }
      return !!data.latitude && !!data.longitude;
    },
    {
      message:
        "Google Maps link is required for link mode, coordinates are required for manual mode",
    },
  );

export type SubmitCourtInput = z.infer<typeof SubmitCourtInputSchema>;

export const GetMySubmissionsSchema = z.object({
  limit: S.pagination.limit.default(20),
  offset: S.pagination.offset.default(0),
});

export type GetMySubmissionsInput = z.infer<typeof GetMySubmissionsSchema>;

export const ParseGoogleMapsLinkSchema = z.object({
  url: z.string().trim().check(z.url()),
});

export const AdminListSubmissionsSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  limit: S.pagination.limit.default(20),
  offset: S.pagination.offset.default(0),
});

export type AdminListSubmissionsInput = z.infer<
  typeof AdminListSubmissionsSchema
>;

export const AdminApproveSubmissionSchema = z.object({
  submissionId: S.ids.generic,
});

export const AdminRejectSubmissionSchema = z.object({
  submissionId: S.ids.generic,
  reason: z.string().min(1, { error: "Rejection reason is required" }),
});

export const AdminBanUserSchema = z.object({
  userId: S.ids.generic,
  reason: z.string().min(1, { error: "Ban reason is required" }),
});

export const AdminUnbanUserSchema = z.object({
  userId: S.ids.generic,
});
