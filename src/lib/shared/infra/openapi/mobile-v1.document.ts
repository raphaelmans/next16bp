import "zod-openapi";
import { z } from "zod";
import { createDocument } from "zod-openapi";

const ApiErrorResponseSchema = z.object({
  code: z.string(),
  message: z.string(),
  requestId: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
});

const GenericJsonObjectSchema = z.object({}).passthrough();
const GenericJsonArraySchema = z.array(GenericJsonObjectSchema);

const GenericObjectResponseSchema = z.object({
  data: GenericJsonObjectSchema,
});

const GenericObjectOrCollectionResponseSchema = z.object({
  data: z.union([GenericJsonObjectSchema, GenericJsonArraySchema]),
});

const SuccessResponseSchema = z.object({
  data: z.object({
    success: z.literal(true),
  }),
});

const OkResponseSchema = z.object({
  data: z.object({
    ok: z.literal(true),
  }),
});

const UrlResponseSchema = z.object({
  data: z.object({
    url: z.string(),
  }),
});

const MethodResponseSchema = z.object({
  data: z.object({
    method: GenericJsonObjectSchema,
  }),
});

const MethodsResponseSchema = z.object({
  data: z.object({
    methods: GenericJsonArraySchema,
  }),
});

const PhotosResponseSchema = z.object({
  data: z.object({
    photos: GenericJsonArraySchema,
  }),
});

const GenericJsonBodySchema = z.object({}).passthrough();
const GenericMultipartBodySchema = z.object({}).passthrough();

const AuthMeResponseSchema = z.object({
  data: z.object({
    id: z.string(),
    email: z.string(),
    role: z.enum(["admin", "member", "viewer"]),
  }),
});

const OwnerSetupStatusResponseSchema = z.object({
  data: z.object({
    hasOrganization: z.boolean(),
    organization: z
      .object({
        id: z.string(),
        name: z.string(),
      })
      .nullable(),
    hasPendingClaim: z.boolean(),
    hasVenue: z.boolean(),
    hasAnyConfiguredVenue: z.boolean(),
    primaryPlace: z
      .object({
        id: z.string(),
        name: z.string(),
      })
      .nullable(),
    verificationStatus: z
      .enum(["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"])
      .nullable(),
    hasVerification: z.boolean(),
    hasActiveCourt: z.boolean(),
    hasReadyCourt: z.boolean(),
    hasCourtSchedule: z.boolean(),
    hasCourtPricing: z.boolean(),
    hasPaymentMethod: z.boolean(),
    primaryCourtId: z.string().nullable(),
    readyCourtId: z.string().nullable(),
    isSetupComplete: z.boolean(),
    nextStep: z.enum([
      "create_organization",
      "add_or_claim_venue",
      "claim_pending",
      "verify_venue",
      "configure_courts",
      "add_payment_method",
      "complete",
    ]),
  }),
});

const OrganizationSchema = z.object({
  id: z.string(),
  ownerUserId: z.string(),
  name: z.string(),
  slug: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const OrganizationProfileSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  description: z.string().nullable(),
  logoUrl: z.string().nullable(),
  contactEmail: z.string().nullable(),
  contactPhone: z.string().nullable(),
  address: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const OwnerOrganizationsListResponseSchema = z.object({
  data: z.array(OrganizationSchema),
});

const OwnerOrganizationsCreateResponseSchema = z.object({
  data: z.object({
    organization: OrganizationSchema,
    profile: OrganizationProfileSchema.nullable(),
  }),
});

const ReservationEventSchema = z.object({
  id: z.string(),
  reservationId: z.string(),
  fromStatus: z.string().nullable(),
  toStatus: z.string(),
  triggeredByUserId: z.string().nullable(),
  triggeredByRole: z.enum(["USER", "OWNER", "SYSTEM", "ADMIN"]),
  notes: z.string().nullable(),
  createdAt: z.string(),
});

const OwnerReservationHistoryResponseSchema = z.object({
  data: z.array(ReservationEventSchema),
});

const UuidSchema = z.string().uuid();
const StringSchema = z.string();
const OwnerReservationChatThreadMetasQuerySchema = z.object({
  reservationIds: z.array(UuidSchema).max(30).optional(),
  reservationGroupIds: z.array(UuidSchema).max(30).optional(),
  includeArchived: z.boolean().optional(),
});

const security = [{ bearerAuth: [] }];

function responses(
  successSchema: z.ZodTypeAny = GenericObjectOrCollectionResponseSchema,
) {
  return {
    "200": {
      description: "OK",
      content: {
        "application/json": {
          schema: successSchema,
        },
      },
    },
    "400": {
      description: "Bad request",
      content: {
        "application/json": {
          schema: ApiErrorResponseSchema,
        },
      },
    },
    "401": {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: ApiErrorResponseSchema,
        },
      },
    },
    "403": {
      description: "Forbidden",
      content: {
        "application/json": {
          schema: ApiErrorResponseSchema,
        },
      },
    },
    "404": {
      description: "Not found",
      content: {
        "application/json": {
          schema: ApiErrorResponseSchema,
        },
      },
    },
    "409": {
      description: "Conflict",
      content: {
        "application/json": {
          schema: ApiErrorResponseSchema,
        },
      },
    },
    "422": {
      description: "Unprocessable entity",
      content: {
        "application/json": {
          schema: ApiErrorResponseSchema,
        },
      },
    },
    "429": {
      description: "Too many requests",
      content: {
        "application/json": {
          schema: ApiErrorResponseSchema,
        },
      },
    },
    "500": {
      description: "Internal error",
      content: {
        "application/json": {
          schema: ApiErrorResponseSchema,
        },
      },
    },
  };
}

function requestParams(path?: z.ZodTypeAny, query?: z.ZodTypeAny) {
  const params: Record<string, z.ZodTypeAny> = {};
  if (path) params.path = path;
  if (query) params.query = query;
  return Object.keys(params).length > 0 ? { requestParams: params } : {};
}

function jsonRequestBody(schema: z.ZodTypeAny = GenericJsonBodySchema) {
  return {
    requestBody: {
      content: {
        "application/json": {
          schema,
        },
      },
    },
  };
}

function multipartRequestBody(
  schema: z.ZodTypeAny = GenericMultipartBodySchema,
) {
  return {
    requestBody: {
      content: {
        "multipart/form-data": {
          schema,
        },
      },
    },
  };
}

function protectedGet(options: {
  operationId: string;
  path?: z.ZodTypeAny;
  query?: z.ZodTypeAny;
  successSchema?: z.ZodTypeAny;
}) {
  return {
    operationId: options.operationId,
    security,
    ...requestParams(options.path, options.query),
    responses: responses(options.successSchema),
  };
}

function protectedMutation(options: {
  operationId: string;
  path?: z.ZodTypeAny;
  query?: z.ZodTypeAny;
  bodyType?: "json" | "multipart";
  bodySchema?: z.ZodTypeAny;
  successSchema?: z.ZodTypeAny;
}) {
  const body =
    options.bodyType === "multipart"
      ? multipartRequestBody(options.bodySchema)
      : options.bodyType === "json"
        ? jsonRequestBody(options.bodySchema)
        : {};

  return {
    operationId: options.operationId,
    security,
    ...requestParams(options.path, options.query),
    ...body,
    responses: responses(options.successSchema),
  };
}

function publicGet(options: {
  operationId: string;
  path?: z.ZodTypeAny;
  query?: z.ZodTypeAny;
  successSchema?: z.ZodTypeAny;
}) {
  return {
    operationId: options.operationId,
    ...requestParams(options.path, options.query),
    responses: responses(options.successSchema),
  };
}

export function createMobileV1OpenApiDocument(args: {
  baseUrl: string;
  basePath?: string;
}) {
  return createDocument({
    openapi: "3.1.0",
    info: {
      title: "KudosCourts API",
      version: "1.0.0",
    },
    servers: [{ url: `${args.baseUrl}${args.basePath ?? "/api/v1"}` }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    paths: {
      "/auth/me": {
        get: protectedGet({
          operationId: "authMe",
          successSchema: AuthMeResponseSchema,
        }),
      },

      "/organization/setup/status": {
        get: protectedGet({
          operationId: "organizationSetupGetStatus",
          successSchema: OwnerSetupStatusResponseSchema,
        }),
      },

      "/organization/organizations": {
        get: protectedGet({
          operationId: "organizationOrganizationList",
          successSchema: OwnerOrganizationsListResponseSchema,
        }),
        post: protectedMutation({
          operationId: "organizationOrganizationCreate",
          bodyType: "json",
          bodySchema: z.object({
            name: z.string(),
            slug: z.string().optional(),
          }),
          successSchema: OwnerOrganizationsCreateResponseSchema,
        }),
      },

      "/organization/organizations/{organizationId}": {
        get: protectedGet({
          operationId: "organizationOrganizationGetById",
          path: z.object({ organizationId: UuidSchema }),
          successSchema: OwnerOrganizationsCreateResponseSchema,
        }),
        patch: protectedMutation({
          operationId: "organizationOrganizationUpdate",
          path: z.object({ organizationId: UuidSchema }),
          bodyType: "json",
        }),
      },

      "/organization/organizations/{organizationId}/profile": {
        patch: protectedMutation({
          operationId: "organizationOrganizationUpdateProfile",
          path: z.object({ organizationId: UuidSchema }),
          bodyType: "json",
          successSchema: GenericObjectResponseSchema,
        }),
      },

      "/organization/organizations/{organizationId}/logo": {
        post: protectedMutation({
          operationId: "organizationOrganizationUploadLogo",
          path: z.object({ organizationId: UuidSchema }),
          bodyType: "multipart",
          successSchema: UrlResponseSchema,
        }),
      },

      "/organization/organizations/{organizationId}/venues": {
        get: protectedGet({
          operationId: "organizationVenueList",
          path: z.object({ organizationId: UuidSchema }),
        }),
        post: protectedMutation({
          operationId: "organizationVenueCreate",
          path: z.object({ organizationId: UuidSchema }),
          bodyType: "json",
        }),
      },

      "/organization/venues/{venueId}": {
        get: protectedGet({
          operationId: "organizationVenueGetById",
          path: z.object({ venueId: UuidSchema }),
        }),
        patch: protectedMutation({
          operationId: "organizationVenueUpdate",
          path: z.object({ venueId: UuidSchema }),
          bodyType: "json",
        }),
        delete: protectedMutation({
          operationId: "organizationVenueDelete",
          path: z.object({ venueId: UuidSchema }),
          successSchema: SuccessResponseSchema,
        }),
      },

      "/organization/venues/{venueId}/photos": {
        post: protectedMutation({
          operationId: "organizationVenueUploadPhoto",
          path: z.object({ venueId: UuidSchema }),
          bodyType: "multipart",
        }),
      },

      "/organization/venues/{venueId}/photos/{photoId}": {
        delete: protectedMutation({
          operationId: "organizationVenueDeletePhoto",
          path: z.object({ venueId: UuidSchema, photoId: UuidSchema }),
          successSchema: SuccessResponseSchema,
        }),
      },

      "/organization/venues/{venueId}/photos/reorder": {
        post: protectedMutation({
          operationId: "organizationVenueReorderPhotos",
          path: z.object({ venueId: UuidSchema }),
          bodyType: "json",
          successSchema: PhotosResponseSchema,
        }),
      },

      "/organization/venues/{venueId}/courts": {
        get: protectedGet({
          operationId: "organizationCourtListByVenue",
          path: z.object({ venueId: UuidSchema }),
        }),
        post: protectedMutation({
          operationId: "organizationCourtCreate",
          path: z.object({ venueId: UuidSchema }),
          bodyType: "json",
        }),
      },

      "/organization/courts/{courtId}": {
        get: protectedGet({
          operationId: "organizationCourtGetById",
          path: z.object({ courtId: UuidSchema }),
        }),
        patch: protectedMutation({
          operationId: "organizationCourtUpdate",
          path: z.object({ courtId: UuidSchema }),
          bodyType: "json",
        }),
      },

      "/organization/courts/{courtId}/hours": {
        get: protectedGet({
          operationId: "organizationCourtHoursGet",
          path: z.object({ courtId: UuidSchema }),
        }),
        put: protectedMutation({
          operationId: "organizationCourtHoursSet",
          path: z.object({ courtId: UuidSchema }),
          bodyType: "json",
        }),
      },

      "/organization/courts/{courtId}/hours/copy-from": {
        post: protectedMutation({
          operationId: "organizationCourtHoursCopyFrom",
          path: z.object({ courtId: UuidSchema }),
          bodyType: "json",
        }),
      },

      "/organization/courts/{courtId}/rate-rules": {
        get: protectedGet({
          operationId: "organizationCourtRateRulesGet",
          path: z.object({ courtId: UuidSchema }),
        }),
        put: protectedMutation({
          operationId: "organizationCourtRateRulesSet",
          path: z.object({ courtId: UuidSchema }),
          bodyType: "json",
        }),
      },

      "/organization/courts/{courtId}/rate-rules/copy-from": {
        post: protectedMutation({
          operationId: "organizationCourtRateRulesCopyFrom",
          path: z.object({ courtId: UuidSchema }),
          bodyType: "json",
        }),
      },

      "/organization/courts/{courtId}/blocks": {
        get: protectedGet({
          operationId: "organizationCourtBlocksList",
          path: z.object({ courtId: UuidSchema }),
          query: z.object({
            startTime: StringSchema,
            endTime: StringSchema,
          }),
        }),
      },

      "/organization/courts/{courtId}/blocks/maintenance": {
        post: protectedMutation({
          operationId: "organizationCourtBlockCreateMaintenance",
          path: z.object({ courtId: UuidSchema }),
          bodyType: "json",
        }),
      },

      "/organization/courts/{courtId}/blocks/walk-in": {
        post: protectedMutation({
          operationId: "organizationCourtBlockCreateWalkIn",
          path: z.object({ courtId: UuidSchema }),
          bodyType: "json",
        }),
      },

      "/organization/blocks/{blockId}/cancel": {
        post: protectedMutation({
          operationId: "organizationCourtBlockCancel",
          path: z.object({ blockId: UuidSchema }),
        }),
      },

      "/organization/blocks/{blockId}/range": {
        patch: protectedMutation({
          operationId: "organizationCourtBlockUpdateRange",
          path: z.object({ blockId: UuidSchema }),
          bodyType: "json",
        }),
      },

      "/organization/organizations/{organizationId}/reservations": {
        get: protectedGet({
          operationId: "organizationReservationListByOrganization",
          path: z.object({ organizationId: UuidSchema }),
        }),
      },

      "/organization/organizations/{organizationId}/reservations/pending-count":
        {
          get: protectedGet({
            operationId: "organizationReservationPendingCount",
            path: z.object({ organizationId: UuidSchema }),
          }),
        },

      "/organization/reservations/{reservationId}/accept": {
        post: protectedMutation({
          operationId: "organizationReservationAccept",
          path: z.object({ reservationId: UuidSchema }),
        }),
      },

      "/organization/reservations/{reservationId}/reject": {
        post: protectedMutation({
          operationId: "organizationReservationReject",
          path: z.object({ reservationId: UuidSchema }),
          bodyType: "json",
        }),
      },

      "/organization/reservations/{reservationId}/confirm-payment": {
        post: protectedMutation({
          operationId: "organizationReservationConfirmPayment",
          path: z.object({ reservationId: UuidSchema }),
          bodyType: "json",
        }),
      },

      "/organization/reservations/{reservationId}/confirm-paid-offline": {
        post: protectedMutation({
          operationId: "organizationReservationConfirmPaidOffline",
          path: z.object({ reservationId: UuidSchema }),
          bodyType: "json",
        }),
      },

      "/organization/reservations/{reservationId}/history": {
        get: protectedGet({
          operationId: "organizationReservationHistory",
          path: z.object({ reservationId: UuidSchema }),
          successSchema: OwnerReservationHistoryResponseSchema,
        }),
      },

      "/organization/courts/{courtId}/reservations/pending": {
        get: protectedGet({
          operationId: "organizationReservationPendingByCourt",
          path: z.object({ courtId: UuidSchema }),
        }),
      },

      "/organization/courts/{courtId}/reservations/active": {
        get: protectedGet({
          operationId: "organizationReservationActiveByCourt",
          path: z.object({ courtId: UuidSchema }),
          query: z.object({
            startTime: StringSchema,
            endTime: StringSchema,
          }),
        }),
      },

      "/organization/reservations/guest-booking": {
        post: protectedMutation({
          operationId: "organizationReservationCreateGuestBooking",
          bodyType: "json",
        }),
      },

      "/organization/blocks/{blockId}/convert-to-guest": {
        post: protectedMutation({
          operationId: "organizationBlockConvertToGuestBooking",
          path: z.object({ blockId: UuidSchema }),
          bodyType: "json",
        }),
      },

      "/organization/organizations/{organizationId}/payment-methods": {
        get: protectedGet({
          operationId: "organizationPaymentMethodList",
          path: z.object({ organizationId: UuidSchema }),
          successSchema: MethodsResponseSchema,
        }),
        post: protectedMutation({
          operationId: "organizationPaymentMethodCreate",
          path: z.object({ organizationId: UuidSchema }),
          bodyType: "json",
          successSchema: MethodResponseSchema,
        }),
      },

      "/organization/payment-methods/{paymentMethodId}": {
        patch: protectedMutation({
          operationId: "organizationPaymentMethodUpdate",
          path: z.object({ paymentMethodId: UuidSchema }),
          bodyType: "json",
          successSchema: MethodResponseSchema,
        }),
        delete: protectedMutation({
          operationId: "organizationPaymentMethodDelete",
          path: z.object({ paymentMethodId: UuidSchema }),
          successSchema: SuccessResponseSchema,
        }),
      },

      "/organization/payment-methods/{paymentMethodId}/set-default": {
        post: protectedMutation({
          operationId: "organizationPaymentMethodSetDefault",
          path: z.object({ paymentMethodId: UuidSchema }),
          successSchema: SuccessResponseSchema,
        }),
      },

      "/organization/venues/{venueId}/verification": {
        get: protectedGet({
          operationId: "organizationPlaceVerificationGet",
          path: z.object({ venueId: UuidSchema }),
        }),
      },

      "/organization/venues/{venueId}/verification/submit": {
        post: protectedMutation({
          operationId: "organizationPlaceVerificationSubmit",
          path: z.object({ venueId: UuidSchema }),
          bodyType: "multipart",
          successSchema: SuccessResponseSchema,
        }),
      },

      "/organization/venues/{venueId}/reservations/toggle": {
        post: protectedMutation({
          operationId: "organizationPlaceToggleReservations",
          path: z.object({ venueId: UuidSchema }),
          bodyType: "json",
          successSchema: SuccessResponseSchema,
        }),
      },

      "/organization/claims": {
        get: protectedGet({
          operationId: "organizationClaimListMy",
        }),
        post: protectedMutation({
          operationId: "organizationClaimCreate",
          bodyType: "json",
        }),
      },

      "/organization/claims/{requestId}": {
        get: protectedGet({
          operationId: "organizationClaimGetById",
          path: z.object({ requestId: UuidSchema }),
        }),
      },

      "/organization/claims/{requestId}/cancel": {
        post: protectedMutation({
          operationId: "organizationClaimCancel",
          path: z.object({ requestId: UuidSchema }),
        }),
      },

      "/organization/removals": {
        post: protectedMutation({
          operationId: "organizationClaimSubmitRemoval",
          bodyType: "json",
        }),
      },

      "/organization/organizations/{organizationId}/guest-profiles": {
        get: protectedGet({
          operationId: "organizationGuestProfileList",
          path: z.object({ organizationId: UuidSchema }),
        }),
        post: protectedMutation({
          operationId: "organizationGuestProfileCreate",
          path: z.object({ organizationId: UuidSchema }),
          bodyType: "json",
        }),
      },

      "/organization/organizations/{organizationId}/reservation-policy": {
        get: protectedGet({
          operationId: "organizationReservationPolicyGet",
          path: z.object({ organizationId: UuidSchema }),
        }),
        patch: protectedMutation({
          operationId: "organizationReservationPolicyUpdate",
          path: z.object({ organizationId: UuidSchema }),
          bodyType: "json",
        }),
      },

      "/organization/import/bookings": {
        post: protectedMutation({
          operationId: "organizationBookingsImportCreate",
          bodyType: "multipart",
        }),
      },

      "/organization/import/bookings/jobs": {
        get: protectedGet({
          operationId: "organizationBookingsImportJobsList",
        }),
      },

      "/organization/import/bookings/jobs/{jobId}": {
        get: protectedGet({
          operationId: "organizationBookingsImportJobGet",
          path: z.object({ jobId: UuidSchema }),
        }),
      },

      "/organization/import/bookings/jobs/{jobId}/rows": {
        get: protectedGet({
          operationId: "organizationBookingsImportRowsList",
          path: z.object({ jobId: UuidSchema }),
        }),
      },

      "/organization/import/bookings/jobs/{jobId}/sources": {
        get: protectedGet({
          operationId: "organizationBookingsImportSourcesList",
          path: z.object({ jobId: UuidSchema }),
        }),
      },

      "/organization/import/bookings/jobs/{jobId}/discard": {
        post: protectedMutation({
          operationId: "organizationBookingsImportJobDiscard",
          path: z.object({ jobId: UuidSchema }),
          successSchema: SuccessResponseSchema,
        }),
      },

      "/organization/import/bookings/jobs/{jobId}/normalize": {
        post: protectedMutation({
          operationId: "organizationBookingsImportJobNormalize",
          path: z.object({ jobId: UuidSchema }),
          bodyType: "json",
        }),
      },

      "/organization/import/bookings/jobs/{jobId}/commit": {
        post: protectedMutation({
          operationId: "organizationBookingsImportJobCommit",
          path: z.object({ jobId: UuidSchema }),
        }),
      },

      "/organization/import/bookings/rows/{rowId}": {
        patch: protectedMutation({
          operationId: "organizationBookingsImportRowUpdate",
          path: z.object({ rowId: UuidSchema }),
          bodyType: "json",
        }),
        delete: protectedMutation({
          operationId: "organizationBookingsImportRowDelete",
          path: z.object({ rowId: UuidSchema }),
          successSchema: SuccessResponseSchema,
        }),
      },

      "/organization/import/bookings/rows/{rowId}/replace-with-guest": {
        post: protectedMutation({
          operationId: "organizationBookingsImportRowReplaceWithGuest",
          path: z.object({ rowId: UuidSchema }),
          bodyType: "json",
        }),
      },

      "/organization/import/bookings/ai-usage": {
        get: protectedGet({
          operationId: "organizationBookingsImportAiUsage",
        }),
      },

      "/organization/chat/auth": {
        get: protectedGet({
          operationId: "organizationChatGetAuth",
        }),
      },

      "/organization/chat/reservations/{reservationId}/session": {
        get: protectedGet({
          operationId: "organizationReservationChatGetSession",
          path: z.object({ reservationId: UuidSchema }),
        }),
      },

      "/organization/chat/reservations/thread-metas": {
        get: protectedGet({
          operationId: "organizationReservationChatThreadMetas",
          query: OwnerReservationChatThreadMetasQuerySchema,
        }),
      },

      "/organization/chat/reservations/{reservationId}/messages": {
        post: protectedMutation({
          operationId: "organizationReservationChatSendMessage",
          path: z.object({ reservationId: UuidSchema }),
          bodyType: "json",
          successSchema: OkResponseSchema,
        }),
      },

      "/push-tokens": {
        put: protectedMutation({
          operationId: "pushTokenUpsert",
          bodyType: "json",
          bodySchema: z.object({
            expoPushToken: z.string(),
            platform: z.enum(["ios", "android"]),
          }),
          successSchema: z.object({
            data: z.object({ expoPushToken: z.string() }),
          }),
        }),
        delete: protectedMutation({
          operationId: "pushTokenRevoke",
          bodyType: "json",
          bodySchema: z.object({
            expoPushToken: z.string(),
          }),
          successSchema: SuccessResponseSchema,
        }),
      },

      "/public/sports": {
        get: publicGet({
          operationId: "publicSportsList",
          successSchema: GenericObjectOrCollectionResponseSchema,
        }),
      },

      "/public/venues": {
        get: publicGet({
          operationId: "publicVenuesList",
          successSchema: GenericObjectOrCollectionResponseSchema,
        }),
      },

      "/public/venues/{placeIdOrSlug}": {
        get: publicGet({
          operationId: "publicVenueGetByIdOrSlug",
          path: z.object({ placeIdOrSlug: StringSchema }),
          successSchema: GenericObjectOrCollectionResponseSchema,
        }),
      },
    },
  });
}
