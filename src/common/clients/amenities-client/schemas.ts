import { z } from "zod";
import { createResponseSchema } from "@/lib/shared/kernel/response";

export const amenitiesSchema = z.array(z.string());

export const amenitiesResponseSchema = createResponseSchema(amenitiesSchema);

export type AmenitiesResponse = z.infer<typeof amenitiesResponseSchema>;
