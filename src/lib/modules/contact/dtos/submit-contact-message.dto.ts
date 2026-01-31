import { z } from "zod";
import { S } from "@/common/schemas";

export const SubmitContactMessageSchema = z.object({
  name: S.contact.name,
  email: S.contact.email,
  subject: S.contact.subject,
  message: S.contact.message,
});

export type SubmitContactMessageDTO = z.infer<
  typeof SubmitContactMessageSchema
>;
