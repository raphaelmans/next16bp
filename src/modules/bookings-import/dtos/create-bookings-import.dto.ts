import { z } from "zod";
import { zfd } from "zod-form-data";
import { importFileSchema } from "@/modules/storage/dtos";
import { S, V } from "@/shared/kernel/schemas";

export const ImportSourceSchema = z.enum(["ics", "csv", "xlsx", "image"], {
  error: V.bookingsImport.sourceType.invalid.message,
});

export const CreateBookingsImportSchema = zfd.formData({
  placeId: zfd.text(S.ids.placeId),
  selectedCourtId: zfd.text(S.ids.courtId).optional(),
  files: zfd
    .repeatableOfType(importFileSchema)
    .refine((files) => files.length >= 1, {
      error: S.common.itemsMin.message,
    })
    .refine((files) => files.length <= 3, {
      error: "Upload up to 3 files",
    }),
});

export type ImportSource = z.infer<typeof ImportSourceSchema>;
export type CreateBookingsImportDTO = z.infer<
  typeof CreateBookingsImportSchema
>;
