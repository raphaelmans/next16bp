import { z } from "zod";

export const ListSportsSchema = z.void();

export type ListSportsDTO = z.infer<typeof ListSportsSchema>;
