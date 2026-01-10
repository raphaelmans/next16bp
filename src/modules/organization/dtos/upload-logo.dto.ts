import { z } from "zod";
import { zfd } from "zod-form-data";
import { imageFileSchema } from "@/modules/storage/dtos";

/**
 * Schema for organization logo upload FormData.
 */
export const UploadOrgLogoSchema = zfd.formData({
  organizationId: zfd.text(z.string().uuid()),
  image: imageFileSchema,
});

export type UploadOrgLogoInput = {
  organizationId: string;
  image: File;
};
