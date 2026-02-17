import { z } from "zod";
import { S } from "@/common/schemas";

export const RequestJoinOpenPlaySchema = z.object({
  openPlayId: S.ids.generic,
  message: z.string().trim().max(2000).optional(),
});

export type RequestJoinOpenPlayDTO = z.infer<typeof RequestJoinOpenPlaySchema>;

export const LeaveOpenPlaySchema = z.object({
  openPlayId: S.ids.generic,
});

export type LeaveOpenPlayDTO = z.infer<typeof LeaveOpenPlaySchema>;
