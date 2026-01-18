import { z } from "zod";

const phProvinceCitySchema = z.object({
  name: z.string(),
  displayName: z.string(),
  slug: z.string(),
});

export const phProvincesCitiesSchema = z.array(
  phProvinceCitySchema.extend({
    cities: z.array(phProvinceCitySchema),
  }),
);

export type PHProvincesCities = z.infer<typeof phProvincesCitiesSchema>;
export type PHProvinceCity = z.infer<typeof phProvinceCitySchema>;

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
