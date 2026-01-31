import { zfd } from "zod-form-data";
import { S } from "@/common/schemas";
import { imageFileSchema } from "@/lib/modules/storage/dtos";

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
