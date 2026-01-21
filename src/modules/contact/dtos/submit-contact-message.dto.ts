import { z } from "zod";

export const SubmitContactMessageSchema = z.object({
  name: z.string().min(2).max(150),
  email: z.string().email().max(255),
  subject: z.string().min(2).max(200),
  message: z.string().min(10).max(2000),
});

export type SubmitContactMessageDTO = z.infer<typeof SubmitContactMessageSchema>;
