import { zfd } from "zod-form-data";
import { imageFileSchema } from "@/lib/modules/storage/dtos";

/**
 * Schema for avatar upload FormData.
 * userId comes from session, not from client.
 */
export const UploadAvatarSchema = zfd.formData({
  image: imageFileSchema,
});

export type UploadAvatarInput = {
  image: File;
};
