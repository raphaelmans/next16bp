import { z } from "zod";

export const phProvincesCitiesSchema = z.record(
  z.string(),
  z.array(z.string()),
);

export type PHProvincesCities = z.infer<typeof phProvincesCitiesSchema>;

export const phProvincesCitiesResponseSchema = z.object({
  data: phProvincesCitiesSchema,
  meta: z
    .object({
      totalProvinces: z.number().int(),
    })
    .optional(),
});

export type PHProvincesCitiesResponse = z.infer<
  typeof phProvincesCitiesResponseSchema
>;
