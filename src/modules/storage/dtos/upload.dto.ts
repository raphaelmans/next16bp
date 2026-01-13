import { zfd } from "zod-form-data";

/**
 * Maximum file size in bytes (5MB)
 */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Maximum file size for payment proofs (10MB)
 */
export const MAX_PAYMENT_PROOF_SIZE = 10 * 1024 * 1024;

/**
 * Allowed image MIME types
 */
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

/**
 * Human-readable file size limits
 */
export const FILE_SIZE_LIMITS_READABLE = {
  PROFILE_IMAGE: "5MB",
  COURT_PHOTO: "5MB",
  PLACE_PHOTO: "5MB",
  ORG_LOGO: "5MB",
  PAYMENT_PROOF: "10MB",
} as const;

/**
 * Storage bucket names
 */
export const STORAGE_BUCKETS = {
  AVATARS: "avatars",
  PAYMENT_PROOFS: "payment-proofs",
  COURT_PHOTOS: "court-photos",
  PLACE_PHOTOS: "place-photos",
  ORGANIZATION_ASSETS: "organization-assets",
} as const;

export type StorageBucket =
  (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

/**
 * Reusable image file validation schema.
 * Validates file size (max 5MB) and type (JPEG, PNG, WebP).
 */
export const imageFileSchema = zfd
  .file()
  .refine((file) => file.size <= MAX_FILE_SIZE, {
    message: `File must be less than ${FILE_SIZE_LIMITS_READABLE.PROFILE_IMAGE}`,
  })
  .refine(
    (file) =>
      ALLOWED_IMAGE_TYPES.includes(
        file.type as (typeof ALLOWED_IMAGE_TYPES)[number],
      ),
    {
      message: "File must be JPEG, PNG, or WebP",
    },
  );

/**
 * Payment proof file validation schema (allows larger files).
 */
export const paymentProofFileSchema = zfd
  .file()
  .refine((file) => file.size <= MAX_PAYMENT_PROOF_SIZE, {
    message: `File must be less than ${FILE_SIZE_LIMITS_READABLE.PAYMENT_PROOF}`,
  })
  .refine(
    (file) =>
      ALLOWED_IMAGE_TYPES.includes(
        file.type as (typeof ALLOWED_IMAGE_TYPES)[number],
      ),
    {
      message: "File must be JPEG, PNG, or WebP",
    },
  );

/**
 * Upload result returned by storage service
 */
export interface UploadResult {
  url: string;
  path: string;
}

/**
 * Upload options for storage service
 */
export interface UploadOptions {
  bucket: StorageBucket;
  path: string;
  file: File;
  contentType?: string;
  upsert?: boolean;
}
