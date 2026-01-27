import { zfd } from "zod-form-data";
import { imageFileSchema } from "@/modules/storage/dtos";
import { S } from "@/shared/kernel/schemas";

/**
 * Schema for organization logo upload FormData.
 */
export const UploadOrgLogoSchema = zfd.formData({
  organizationId: zfd.text(S.ids.organizationId),
  image: imageFileSchema,
});

export type UploadOrgLogoInput = {
  organizationId: string;
  image: File;
};
