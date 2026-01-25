import { z } from "zod";
import { zfd } from "zod-form-data";
import { importFileSchema } from "@/modules/storage/dtos";

export const ImportSourceSchema = z.enum(["ics", "csv", "xlsx", "image"]);

export const CreateBookingsImportSchema = zfd.formData({
  placeId: zfd.text(z.string().uuid()),
  sourceType: zfd.text(ImportSourceSchema),
  file: importFileSchema,
});

export type ImportSource = z.infer<typeof ImportSourceSchema>;
export type CreateBookingsImportDTO = z.infer<
  typeof CreateBookingsImportSchema
>;
