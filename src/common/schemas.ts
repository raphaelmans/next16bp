import { z } from "zod";
import { validationDatabase as V } from "@/common/validation-database";

const stringBase = (
  requiredMessage: string,
  typeMessage: string = V.common.string.type.message,
) =>
  z.string({
    error: (issue) =>
      issue.input === undefined ? requiredMessage : typeMessage,
  });

const trimmedStringBase = (
  requiredMessage: string,
  typeMessage: string = V.common.string.type.message,
) => stringBase(requiredMessage, typeMessage).trim();

const withMin = (
  schema: z.ZodString,
  min: { value: number; message: string },
) => schema.min(min.value, { error: min.message });

const withMax = (
  schema: z.ZodString,
  max: { value: number; message: string },
) => schema.max(max.value, { error: max.message });

const withMinMax = (
  schema: z.ZodString,
  min?: { value: number; message: string },
  max?: { value: number; message: string },
) => {
  const withMinSchema = min ? withMin(schema, min) : schema;
  return max ? withMax(withMinSchema, max) : withMinSchema;
};

export const allowEmptyString = <T extends z.ZodTypeAny>(schema: T) =>
  z.union([schema, z.literal("")]);

export const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z
    .union([schema, z.literal("")])
    .transform((value) => (value === "" ? undefined : value));

export function modifySchema<
  Shape extends z.ZodRawShape,
  Overrides extends Partial<{ [K in keyof Shape]: z.ZodTypeAny }>,
>(schema: z.ZodObject<Shape>, overrides: Overrides) {
  return schema.extend(overrides as z.ZodRawShape) as unknown as z.ZodObject<
    Omit<Shape, keyof Overrides> & Overrides
  >;
}

const uuidSchema = (requiredMessage: string, invalidMessage: string) =>
  trimmedStringBase(requiredMessage)
    .min(1, { error: requiredMessage })
    .check(z.uuid({ error: invalidMessage }));

const urlSchema = (invalidMessage = V.common.url.invalid.message) =>
  z
    .string()
    .trim()
    .check(z.url({ error: invalidMessage }));

const emailSchema = z
  .string({
    error: (issue) =>
      issue.input === undefined
        ? V.common.email.required.message
        : V.common.email.type.message,
  })
  .trim()
  .min(V.common.email.min.value, { error: V.common.email.min.message })
  .max(V.common.email.max.value, { error: V.common.email.max.message })
  .check(z.email({ error: V.common.email.invalid.message }));

const passwordSchema = stringBase(
  V.auth.password.required.message,
  V.auth.password.type.message,
)
  .min(V.auth.password.min.value, { error: V.auth.password.min.message })
  .max(V.auth.password.max.value, { error: V.auth.password.max.message });

const slugSchema = withMinMax(
  trimmedStringBase(V.common.slug.min.message),
  V.common.slug.min,
  V.common.slug.max,
).regex(V.common.slug.pattern.value, { error: V.common.slug.pattern.message });

const countrySchema = z.string().length(V.common.country.length.value, {
  error: V.common.country.length.message,
});

const currencySchema = z.string().length(V.common.currency.length.value, {
  error: V.common.currency.length.message,
});

const coordinatePattern = /^-?\d+\.\d+$/;

const coordinateStringSchema = (invalidMessage: string) =>
  z.string().regex(coordinatePattern, { error: invalidMessage }).optional();

const coordinateRequiredSchema = (
  requiredMessage: string,
  invalidMessage: string,
) =>
  trimmedStringBase(requiredMessage)
    .min(1, { error: requiredMessage })
    .regex(coordinatePattern, { error: invalidMessage });

const coordinateInputSchema = (invalidMessage: string) =>
  z.preprocess(
    (value) => {
      if (value === "" || value === null || value === undefined) {
        return undefined;
      }
      if (typeof value === "number") {
        return value.toString();
      }
      return value;
    },
    z
      .string()
      .refine((val) => !Number.isNaN(Number.parseFloat(val)), {
        error: invalidMessage,
      })
      .optional(),
  );

const isoDateTimeSchema = (invalidMessage: string) =>
  z.string().check(z.iso.datetime({ error: invalidMessage }));

const requiredText = (
  requiredMessage: string,
  min?: { value: number; message: string },
  max?: { value: number; message: string },
) => withMinMax(trimmedStringBase(requiredMessage), min, max);

const optionalText = (max?: { value: number; message: string }) =>
  (max ? withMax(z.string().trim(), max) : z.string().trim()).optional();

export const S = {
  common: {
    requiredText: requiredText(
      V.common.string.required.message,
      V.common.nonEmpty.min,
    ),
    optionalText: optionalText(),
    email: emailSchema,
    url: urlSchema,
    slug: slugSchema,
    country: countrySchema,
    currency: currencySchema,
    phone: z
      .string()
      .regex(V.common.phone.pattern.value, {
        error: V.common.phone.pattern.message,
      })
      .max(V.common.phone.max.value, { error: V.common.phone.max.message }),
    coordinateString: {
      latitude: coordinateStringSchema(V.common.coordinate.latitude.message),
      longitude: coordinateStringSchema(V.common.coordinate.longitude.message),
    },
    coordinateRequired: {
      latitude: coordinateRequiredSchema(
        V.common.coordinate.latitudeRequired.message,
        V.common.coordinate.latitude.message,
      ),
      longitude: coordinateRequiredSchema(
        V.common.coordinate.longitudeRequired.message,
        V.common.coordinate.longitude.message,
      ),
    },
    coordinateInput: {
      latitude: coordinateInputSchema(V.common.coordinate.latitude.message),
      longitude: coordinateInputSchema(V.common.coordinate.longitude.message),
    },
    isoDateTime: isoDateTimeSchema(V.common.isoDateTime.invalid.message),
    displayOrder: z.number().int().min(V.common.displayOrder.min.value, {
      error: V.common.displayOrder.min.message,
    }),
    itemsMin: V.common.items.min,
  },
  ids: {
    generic: uuidSchema(
      V.ids.generic.required.message,
      V.ids.generic.invalid.message,
    ),
    organizationId: uuidSchema(
      V.ids.organizationId.required.message,
      V.ids.organizationId.invalid.message,
    ),
    placeId: uuidSchema(
      V.ids.placeId.required.message,
      V.ids.placeId.invalid.message,
    ),
    courtId: uuidSchema(
      V.ids.courtId.required.message,
      V.ids.courtId.invalid.message,
    ),
    reservationId: uuidSchema(
      V.ids.reservationId.required.message,
      V.ids.reservationId.invalid.message,
    ),
    sportId: uuidSchema(
      V.ids.sportId.required.message,
      V.ids.sportId.invalid.message,
    ),
    paymentMethodId: uuidSchema(
      V.ids.paymentMethodId.required.message,
      V.ids.paymentMethodId.invalid.message,
    ),
    requestId: uuidSchema(
      V.ids.requestId.required.message,
      V.ids.requestId.invalid.message,
    ),
    blockId: uuidSchema(
      V.ids.blockId.required.message,
      V.ids.blockId.invalid.message,
    ),
    jobId: uuidSchema(
      V.ids.jobId.required.message,
      V.ids.jobId.invalid.message,
    ),
    rowId: uuidSchema(
      V.ids.rowId.required.message,
      V.ids.rowId.invalid.message,
    ),
    photoId: uuidSchema(
      V.ids.photoId.required.message,
      V.ids.photoId.invalid.message,
    ),
    amenityId: uuidSchema(
      V.ids.amenityId.required.message,
      V.ids.amenityId.invalid.message,
    ),
  },
  auth: {
    email: emailSchema,
    password: passwordSchema,
    loginPassword: stringBase("Password is required").min(1, {
      error: "Password is required",
    }),
  },
  organization: {
    name: requiredText(
      V.organization.name.min.message,
      V.organization.name.min,
      V.organization.name.max,
    ),
    slug: slugSchema,
    description: optionalText(V.organization.description.max),
    contactEmail: emailSchema.max(V.organization.contactEmail.max.value, {
      error: V.organization.contactEmail.max.message,
    }),
    contactPhone: optionalText(V.organization.contactPhone.max),
    address: optionalText(V.organization.address.max),
    search: {
      limit: z
        .number()
        .int()
        .min(V.organization.search.limit.min.value, {
          error: V.organization.search.limit.min.message,
        })
        .max(V.organization.search.limit.max.value, {
          error: V.organization.search.limit.max.message,
        }),
      offset: z.number().int().min(V.organization.search.offset.min.value, {
        error: V.organization.search.offset.min.message,
      }),
    },
  },
  place: {
    searchQuery: requiredText(
      V.place.search.min.message,
      V.place.search.min,
      V.place.search.max,
    ),
    idOrSlug: requiredText(
      V.place.idOrSlug.min.message,
      V.place.idOrSlug.min,
      V.place.idOrSlug.max,
    ),
    name: requiredText(
      V.place.name.min.message,
      V.place.name.min,
      V.place.name.max,
    ),
    address: requiredText(
      V.place.address.min.message,
      V.place.address.min,
      V.place.address.max,
    ),
    city: requiredText(
      V.place.city.min.message,
      V.place.city.min,
      V.place.city.max,
    ),
    province: requiredText(
      V.place.province.min.message,
      V.place.province.min,
      V.place.province.max,
    ),
    timeZone: requiredText(
      V.place.timeZone.min.message,
      V.place.timeZone.min,
      V.place.timeZone.max,
    ),
    phoneNumber: optionalText(V.place.phoneNumber.max),
    viberInfo: optionalText(V.place.viberInfo.max),
    otherContactInfo: optionalText(V.place.otherContactInfo.max),
    googlePlaceId: optionalText(V.place.googlePlaceId.max),
    photos: {
      min: V.place.photos.min,
      max: V.place.photos.max,
    },
    amenity: requiredText(
      V.place.amenity.min.message,
      V.place.amenity.min,
      V.place.amenity.max,
    ),
  },
  court: {
    label: requiredText(
      V.court.label.min.message,
      V.court.label.min,
      V.court.label.max,
    ),
    tierLabel: optionalText(V.court.tierLabel.max),
    name: requiredText(
      V.court.name.min.message,
      V.court.name.min,
      V.court.name.max,
    ),
    simpleName: requiredText(
      V.court.simpleName.min.message,
      V.court.simpleName.min,
      V.court.simpleName.max,
    ),
    description: optionalText(V.court.description.max),
    listMin: V.court.list.min,
  },
  contact: {
    name: requiredText(
      V.contact.name.min.message,
      V.contact.name.min,
      V.contact.name.max,
    ),
    email: emailSchema.max(V.common.email.max.value, {
      error: V.common.email.max.message,
    }),
    subject: requiredText(
      V.contact.subject.min.message,
      V.contact.subject.min,
      V.contact.subject.max,
    ),
    message: requiredText(
      V.contact.message.min.message,
      V.contact.message.min,
      V.contact.message.max,
    ),
  },
  profile: {
    displayName: requiredText(
      V.profile.displayName.min.message,
      V.profile.displayName.min,
      V.profile.displayName.max,
    ),
    phoneNumber: optionalText(V.common.phone.max),
    avatarUrl: urlSchema(V.common.url.invalid.message),
  },
  paymentMethod: {
    accountName: requiredText(
      V.paymentMethod.accountName.min.message,
      V.paymentMethod.accountName.min,
      V.paymentMethod.accountName.max,
    ),
    accountNumber: requiredText(
      V.paymentMethod.accountNumber.min.message,
      V.paymentMethod.accountNumber.min,
      V.paymentMethod.accountNumber.max,
    ),
    instructions: optionalText(V.paymentMethod.instructions.max),
    displayOrder: z.number().int().min(V.paymentMethod.displayOrder.min.value, {
      error: V.paymentMethod.displayOrder.min.message,
    }),
  },
  paymentProof: {
    referenceNumber: optionalText(V.paymentProof.referenceNumber.max),
    notes: optionalText(V.paymentProof.notes.max),
  },
  claimRequest: {
    requestNotes: requiredText(
      V.claimRequest.requestNotes.min.message,
      V.claimRequest.requestNotes.min,
      V.claimRequest.requestNotes.max,
    ),
    requestNotesOptional: optionalText(V.claimRequest.requestNotes.max),
    guestName: requiredText(
      V.claimRequest.guestName.min.message,
      V.claimRequest.guestName.min,
      V.claimRequest.guestName.max,
    ),
    guestEmail: emailSchema.max(V.common.email.max.value, {
      error: V.common.email.max.message,
    }),
    reviewNotes: requiredText(
      V.claimRequest.reviewNotes.min.message,
      V.claimRequest.reviewNotes.min,
      V.claimRequest.reviewNotes.max,
    ),
    reviewNotesOptional: optionalText(V.claimRequest.reviewNotes.max),
    reason: requiredText(
      V.claimRequest.reason.min.message,
      V.claimRequest.reason.min,
      V.claimRequest.reason.max,
    ),
    removalReason: requiredText(
      V.claimRequest.removalReason.min.message,
      V.claimRequest.removalReason.min,
      V.claimRequest.removalReason.max,
    ),
  },
  placeVerification: {
    documentsMin: V.placeVerification.documents.min,
  },
  reservation: {
    notes: optionalText(V.reservation.notes.max),
    cancelReason: optionalText(V.reservation.cancelReason.max),
    rejectReason: requiredText(
      V.reservation.rejectReason.min.message,
      V.reservation.rejectReason.min,
      V.reservation.rejectReason.max,
    ),
    referenceNumber: requiredText(
      V.reservation.referenceNumber.min.message,
      V.reservation.referenceNumber.min,
    ),
  },
  availability: {
    durationMinutes: z
      .number()
      .int()
      .min(V.availability.durationMinutes.min.value, {
        error: V.availability.durationMinutes.min.message,
      })
      .max(V.availability.durationMinutes.max.value, {
        error: V.availability.durationMinutes.max.message,
      })
      .refine(
        (value) =>
          value % V.availability.durationMinutes.multipleOf.value === 0,
        { error: V.availability.durationMinutes.multipleOf.message },
      ),
    courtIds: {
      min: V.availability.courtIds.min,
      max: V.availability.courtIds.max,
    },
  },
  courtBlock: {
    reason: optionalText(V.courtBlock.reason.max),
  },
  bookingsImport: {
    courtLabel: optionalText(V.bookingsImport.courtLabel.max),
    reason: optionalText(V.bookingsImport.reason.max),
  },
  admin: {
    searchQuery: optionalText(V.admin.searchQuery.max),
  },
  pagination: {
    limit: z
      .number()
      .int()
      .min(V.common.pagination.limit.min.value, {
        error: V.common.pagination.limit.min.message,
      })
      .max(V.common.pagination.limit.max.value, {
        error: V.common.pagination.limit.max.message,
      }),
    offset: z.number().int().min(V.common.pagination.offset.min.value, {
      error: V.common.pagination.offset.min.message,
    }),
  },
  courtRateRule: {
    dayOfWeek: z
      .number()
      .int()
      .min(V.courtRateRule.dayOfWeek.min.value, {
        error: V.courtRateRule.dayOfWeek.min.message,
      })
      .max(V.courtRateRule.dayOfWeek.max.value, {
        error: V.courtRateRule.dayOfWeek.max.message,
      }),
    startMinute: z
      .number()
      .int()
      .min(V.courtRateRule.startMinute.min.value, {
        error: V.courtRateRule.startMinute.min.message,
      })
      .max(V.courtRateRule.startMinute.max.value, {
        error: V.courtRateRule.startMinute.max.message,
      }),
    endMinute: z
      .number()
      .int()
      .min(V.courtRateRule.endMinute.min.value, {
        error: V.courtRateRule.endMinute.min.message,
      })
      .max(V.courtRateRule.endMinute.max.value, {
        error: V.courtRateRule.endMinute.max.message,
      }),
    hourlyRateCents: z
      .number()
      .int()
      .min(V.courtRateRule.hourlyRateCents.min.value, {
        error: V.courtRateRule.hourlyRateCents.min.message,
      }),
    rulesMax: V.courtRateRule.rules.max,
    startBeforeEnd: V.courtRateRule.startBeforeEnd.message,
  },
  courtHours: {
    windowsMax: V.courtHours.windows.max,
  },
  pricing: {
    priceCents: z.number().int().min(V.pricing.priceCents.min.value, {
      error: V.pricing.priceCents.min.message,
    }),
  },
};

export { V };
