import { z } from "zod";
import { zfd } from "zod-form-data";
import { S } from "@/common/schemas";
import { imageFileSchema } from "@/lib/modules/storage/dtos";

const optionalUrl = z.string().trim().check(z.url()).optional();

export const CourtEntrySchema = z.object({
  sportId: S.ids.sportId,
  count: z.number().int().min(1).max(20).default(1),
});

export type CourtEntry = z.infer<typeof CourtEntrySchema>;

export const SubmitCourtInputSchema = z
  .object({
    name: S.place.name,
    courts: z
      .array(CourtEntrySchema)
      .min(1, { error: "At least one sport is required" })
      .refine(
        (courts) => {
          const sportIds = courts.map((c) => c.sportId);
          return new Set(sportIds).size === sportIds.length;
        },
        { message: "Each sport can only be added once" },
      ),
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
      const hasLink = !!data.googleMapsLink;
      const hasCoords = !!data.latitude && !!data.longitude;
      if (!hasLink && !hasCoords) return true;
      if (data.locationMode === "link") return hasLink;
      return hasCoords;
    },
    {
      message: "Provide a Google Maps link or both coordinates",
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

export const UploadSubmissionPhotoSchema = zfd.formData({
  placeId: zfd.text(S.ids.placeId),
  image: imageFileSchema,
});

export type UploadSubmissionPhotoInput = {
  placeId: string;
  image: File;
};

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
