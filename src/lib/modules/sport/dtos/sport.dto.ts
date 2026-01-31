import { z } from "zod";

export const ListSportsSchema = z.object({});

export type ListSportsDTO = z.infer<typeof ListSportsSchema>;
