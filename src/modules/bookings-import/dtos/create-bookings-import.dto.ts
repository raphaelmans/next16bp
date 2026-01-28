import { z } from "zod";
import { zfd } from "zod-form-data";
import { importFileSchema } from "@/modules/storage/dtos";
import { S, V } from "@/shared/kernel/schemas";

export const ImportSourceSchema = z.enum(["ics", "csv", "xlsx", "image"], {
  error: V.bookingsImport.sourceType.invalid.message,
});

export const CreateBookingsImportSchema = zfd.formData({
  placeId: zfd.text(S.ids.placeId),
  sourceType: zfd.text(ImportSourceSchema),
  selectedCourtId: zfd.text(S.ids.courtId).optional(),
  file: importFileSchema,
});

export type ImportSource = z.infer<typeof ImportSourceSchema>;
export type CreateBookingsImportDTO = z.infer<
  typeof CreateBookingsImportSchema
>;
