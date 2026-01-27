import { z } from "zod";
import { S, V } from "@/shared/kernel/schemas";

const OptionalNullableCourtLabelSchema = z
  .string()
  .trim()
  .max(V.bookingsImport.courtLabel.max.value, {
    error: V.bookingsImport.courtLabel.max.message,
  })
  .nullable()
  .optional();

const OptionalNullableReasonSchema = z
  .string()
  .trim()
  .max(V.bookingsImport.reason.max.value, {
    error: V.bookingsImport.reason.max.message,
  })
  .nullable()
  .optional();

const OptionalNullableDateSchema = z.coerce
  .date({ error: V.common.date.invalid.message })
  .nullable()
  .optional();

export const UpdateRowSchema = z.object({
  rowId: S.ids.rowId,
  courtId: S.ids.courtId.nullable().optional(),
  courtLabel: OptionalNullableCourtLabelSchema,
  startTime: OptionalNullableDateSchema,
  endTime: OptionalNullableDateSchema,
  reason: OptionalNullableReasonSchema,
});

export type UpdateRowDTO = z.infer<typeof UpdateRowSchema>;
