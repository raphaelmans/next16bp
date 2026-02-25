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

      "/owner/setup/status": {
        get: protectedGet({
          operationId: "ownerSetupGetStatus",
          successSchema: OwnerSetupStatusResponseSchema,
        }),
      },

      "/owner/organizations": {
        get: protectedGet({
          operationId: "ownerOrganizationList",
          successSchema: OwnerOrganizationsListResponseSchema,
        }),
        post: protectedMutation({
          operationId: "ownerOrganizationCreate",
          bodyType: "json",
          bodySchema: z.object({
            name: z.string(),
            slug: z.string().optional(),
          }),
          successSchema: OwnerOrganizationsCreateResponseSchema,
        }),
      },

      "/owner/organizations/{organizationId}": {
        get: protectedGet({
          operationId: "ownerOrganizationGetById",
          path: z.object({ organizationId: UuidSchema }),
          successSchema: OwnerOrganizationsCreateResponseSchema,
        }),
        patch: protectedMutation({
          operationId: "ownerOrganizationUpdate",
          path: z.object({ organizationId: UuidSchema }),
          bodyType: "json",
        }),
      },

      "/owner/organizations/{organizationId}/profile": {
        patch: protectedMutation({
          operationId: "ownerOrganizationUpdateProfile",
          path: z.object({ organizationId: UuidSchema }),
          bodyType: "json",
          successSchema: GenericObjectResponseSchema,
        }),
      },

      "/owner/organizations/{organizationId}/logo": {
        post: protectedMutation({
          operationId: "ownerOrganizationUploadLogo",
          path: z.object({ organizationId: UuidSchema }),
          bodyType: "multipart",
          successSchema: UrlResponseSchema,
        }),
      },

      "/owner/organizations/{organizationId}/venues": {
        get: protectedGet({
          operationId: "ownerVenueList",
          path: z.object({ organizationId: UuidSchema }),
        }),
        post: protectedMutation({
          operationId: "ownerVenueCreate",
          path: z.object({ organizationId: UuidSchema }),
          bodyType: "json",
        }),
      },

      "/owner/venues/{venueId}": {
        get: protectedGet({
          operationId: "ownerVenueGetById",
          path: z.object({ venueId: UuidSchema }),
        }),
        patch: protectedMutation({
          operationId: "ownerVenueUpdate",
          path: z.object({ venueId: UuidSchema }),
          bodyType: "json",
        }),
        delete: protectedMutation({
          operationId: "ownerVenueDelete",
          path: z.object({ venueId: UuidSchema }),
          successSchema: SuccessResponseSchema,
        }),
      },

      "/owner/venues/{venueId}/photos": {
        post: protectedMutation({
          operationId: "ownerVenueUploadPhoto",
          path: z.object({ venueId: UuidSchema }),
          bodyType: "multipart",
        }),
      },

      "/owner/venues/{venueId}/photos/{photoId}": {
        delete: protectedMutation({
          operationId: "ownerVenueDeletePhoto",
          path: z.object({ venueId: UuidSchema, photoId: UuidSchema }),
          successSchema: SuccessResponseSchema,
        }),
      },

      "/owner/venues/{venueId}/photos/reorder": {
        post: protectedMutation({
          operationId: "ownerVenueReorderPhotos",
          path: z.object({ venueId: UuidSchema }),
          bodyType: "json",
          successSchema: PhotosResponseSchema,
        }),
      },

      "/owner/venues/{venueId}/courts": {
        get: protectedGet({
          operationId: "ownerCourtListByVenue",
          path: z.object({ venueId: UuidSchema }),
        }),
        post: protectedMutation({
          operationId: "ownerCourtCreate",
          path: z.object({ venueId: UuidSchema }),
          bodyType: "json",
        }),
      },

      "/owner/courts/{courtId}": {
        get: protectedGet({
          operationId: "ownerCourtGetById",
          path: z.object({ courtId: UuidSchema }),
        }),
        patch: protectedMutation({
          operationId: "ownerCourtUpdate",
          path: z.object({ courtId: UuidSchema }),
          bodyType: "json",
        }),
      },

      "/owner/courts/{courtId}/hours": {
        get: protectedGet({
          operationId: "ownerCourtHoursGet",
          path: z.object({ courtId: UuidSchema }),
        }),
        put: protectedMutation({
          operationId: "ownerCourtHoursSet",
          path: z.object({ courtId: UuidSchema }),
          bodyType: "json",
        }),
      },

      "/owner/courts/{courtId}/hours/copy-from": {
        post: protectedMutation({
          operationId: "ownerCourtHoursCopyFrom",
          path: z.object({ courtId: UuidSchema }),
          bodyType: "json",
        }),
      },

      "/owner/courts/{courtId}/rate-rules": {
        get: protectedGet({
          operationId: "ownerCourtRateRulesGet",
          path: z.object({ courtId: UuidSchema }),
        }),
        put: protectedMutation({
          operationId: "ownerCourtRateRulesSet",
          path: z.object({ courtId: UuidSchema }),
          bodyType: "json",
        }),
      },

      "/owner/courts/{courtId}/rate-rules/copy-from": {
        post: protectedMutation({
          operationId: "ownerCourtRateRulesCopyFrom",
          path: z.object({ courtId: UuidSchema }),
          bodyType: "json",
        }),
      },

      "/owner/courts/{courtId}/blocks": {
        get: protectedGet({
          operationId: "ownerCourtBlocksList",
          path: z.object({ courtId: UuidSchema }),
          query: z.object({
            startTime: StringSchema,
            endTime: StringSchema,
          }),
        }),
      },

      "/owner/courts/{courtId}/blocks/maintenance": {
        post: protectedMutation({
          operationId: "ownerCourtBlockCreateMaintenance",
          path: z.object({ courtId: UuidSchema }),
          bodyType: "json",
        }),
      },

      "/owner/courts/{courtId}/blocks/walk-in": {
        post: protectedMutation({
          operationId: "ownerCourtBlockCreateWalkIn",
          path: z.object({ courtId: UuidSchema }),
          bodyType: "json",
        }),
      },

      "/owner/blocks/{blockId}/cancel": {
        post: protectedMutation({
          operationId: "ownerCourtBlockCancel",
          path: z.object({ blockId: UuidSchema }),
        }),
      },

      "/owner/blocks/{blockId}/range": {
        patch: protectedMutation({
          operationId: "ownerCourtBlockUpdateRange",
          path: z.object({ blockId: UuidSchema }),
          bodyType: "json",
        }),
      },

      "/owner/organizations/{organizationId}/reservations": {
        get: protectedGet({
          operationId: "ownerReservationListByOrganization",
          path: z.object({ organizationId: UuidSchema }),
        }),
      },

      "/owner/organizations/{organizationId}/reservations/pending-count": {
        get: protectedGet({
          operationId: "ownerReservationPendingCount",
          path: z.object({ organizationId: UuidSchema }),
        }),
      },

      "/owner/reservations/{reservationId}/accept": {
        post: protectedMutation({
          operationId: "ownerReservationAccept",
          path: z.object({ reservationId: UuidSchema }),
        }),
      },

      "/owner/reservations/{reservationId}/reject": {
        post: protectedMutation({
          operationId: "ownerReservationReject",
          path: z.object({ reservationId: UuidSchema }),
          bodyType: "json",
        }),
      },

      "/owner/reservations/{reservationId}/confirm-payment": {
        post: protectedMutation({
          operationId: "ownerReservationConfirmPayment",
          path: z.object({ reservationId: UuidSchema }),
          bodyType: "json",
        }),
      },

      "/owner/reservations/{reservationId}/confirm-paid-offline": {
        post: protectedMutation({
          operationId: "ownerReservationConfirmPaidOffline",
          path: z.object({ reservationId: UuidSchema }),
          bodyType: "json",
        }),
      },

      "/owner/reservations/{reservationId}/history": {
        get: protectedGet({
          operationId: "ownerReservationHistory",
          path: z.object({ reservationId: UuidSchema }),
          successSchema: OwnerReservationHistoryResponseSchema,
        }),
      },

      "/owner/courts/{courtId}/reservations/pending": {
        get: protectedGet({
          operationId: "ownerReservationPendingByCourt",
          path: z.object({ courtId: UuidSchema }),
        }),
      },

      "/owner/courts/{courtId}/reservations/active": {
        get: protectedGet({
          operationId: "ownerReservationActiveByCourt",
          path: z.object({ courtId: UuidSchema }),
          query: z.object({
            startTime: StringSchema,
            endTime: StringSchema,
          }),
        }),
      },

      "/owner/reservations/guest-booking": {
        post: protectedMutation({
          operationId: "ownerReservationCreateGuestBooking",
          bodyType: "json",
        }),
      },

      "/owner/blocks/{blockId}/convert-to-guest": {
        post: protectedMutation({
          operationId: "ownerBlockConvertToGuestBooking",
          path: z.object({ blockId: UuidSchema }),
          bodyType: "json",
        }),
      },

      "/owner/organizations/{organizationId}/payment-methods": {
        get: protectedGet({
          operationId: "ownerPaymentMethodList",
          path: z.object({ organizationId: UuidSchema }),
          successSchema: MethodsResponseSchema,
        }),
        post: protectedMutation({
          operationId: "ownerPaymentMethodCreate",
          path: z.object({ organizationId: UuidSchema }),
          bodyType: "json",
          successSchema: MethodResponseSchema,
        }),
      },

      "/owner/payment-methods/{paymentMethodId}": {
        patch: protectedMutation({
          operationId: "ownerPaymentMethodUpdate",
          path: z.object({ paymentMethodId: UuidSchema }),
          bodyType: "json",
          successSchema: MethodResponseSchema,
        }),
        delete: protectedMutation({
          operationId: "ownerPaymentMethodDelete",
          path: z.object({ paymentMethodId: UuidSchema }),
          successSchema: SuccessResponseSchema,
        }),
      },

      "/owner/payment-methods/{paymentMethodId}/set-default": {
        post: protectedMutation({
          operationId: "ownerPaymentMethodSetDefault",
          path: z.object({ paymentMethodId: UuidSchema }),
          successSchema: SuccessResponseSchema,
        }),
      },

      "/owner/venues/{venueId}/verification": {
        get: protectedGet({
          operationId: "ownerPlaceVerificationGet",
          path: z.object({ venueId: UuidSchema }),
        }),
      },

      "/owner/venues/{venueId}/verification/submit": {
        post: protectedMutation({
          operationId: "ownerPlaceVerificationSubmit",
          path: z.object({ venueId: UuidSchema }),
          bodyType: "multipart",
          successSchema: SuccessResponseSchema,
        }),
      },

      "/owner/venues/{venueId}/reservations/toggle": {
        post: protectedMutation({
          operationId: "ownerPlaceToggleReservations",
          path: z.object({ venueId: UuidSchema }),
          bodyType: "json",
          successSchema: SuccessResponseSchema,
        }),
      },

      "/owner/claims": {
        get: protectedGet({
          operationId: "ownerClaimListMy",
        }),
        post: protectedMutation({
          operationId: "ownerClaimCreate",
          bodyType: "json",
        }),
      },

      "/owner/claims/{requestId}": {
        get: protectedGet({
          operationId: "ownerClaimGetById",
          path: z.object({ requestId: UuidSchema }),
        }),
      },

      "/owner/claims/{requestId}/cancel": {
        post: protectedMutation({
          operationId: "ownerClaimCancel",
          path: z.object({ requestId: UuidSchema }),
        }),
      },

      "/owner/removals": {
        post: protectedMutation({
          operationId: "ownerClaimSubmitRemoval",
          bodyType: "json",
        }),
      },

      "/owner/organizations/{organizationId}/guest-profiles": {
        get: protectedGet({
          operationId: "ownerGuestProfileList",
          path: z.object({ organizationId: UuidSchema }),
        }),
        post: protectedMutation({
          operationId: "ownerGuestProfileCreate",
          path: z.object({ organizationId: UuidSchema }),
          bodyType: "json",
        }),
      },

      "/owner/organizations/{organizationId}/reservation-policy": {
        get: protectedGet({
          operationId: "ownerReservationPolicyGet",
          path: z.object({ organizationId: UuidSchema }),
        }),
        patch: protectedMutation({
          operationId: "ownerReservationPolicyUpdate",
          path: z.object({ organizationId: UuidSchema }),
          bodyType: "json",
        }),
      },

      "/owner/import/bookings": {
        post: protectedMutation({
          operationId: "ownerBookingsImportCreate",
          bodyType: "multipart",
        }),
      },

      "/owner/import/bookings/jobs": {
        get: protectedGet({
          operationId: "ownerBookingsImportJobsList",
        }),
      },

      "/owner/import/bookings/jobs/{jobId}": {
        get: protectedGet({
          operationId: "ownerBookingsImportJobGet",
          path: z.object({ jobId: UuidSchema }),
        }),
      },

      "/owner/import/bookings/jobs/{jobId}/rows": {
        get: protectedGet({
          operationId: "ownerBookingsImportRowsList",
          path: z.object({ jobId: UuidSchema }),
        }),
      },

      "/owner/import/bookings/jobs/{jobId}/sources": {
        get: protectedGet({
          operationId: "ownerBookingsImportSourcesList",
          path: z.object({ jobId: UuidSchema }),
        }),
      },

      "/owner/import/bookings/jobs/{jobId}/discard": {
        post: protectedMutation({
          operationId: "ownerBookingsImportJobDiscard",
          path: z.object({ jobId: UuidSchema }),
          successSchema: SuccessResponseSchema,
        }),
      },

      "/owner/import/bookings/jobs/{jobId}/normalize": {
        post: protectedMutation({
          operationId: "ownerBookingsImportJobNormalize",
          path: z.object({ jobId: UuidSchema }),
          bodyType: "json",
        }),
      },

      "/owner/import/bookings/jobs/{jobId}/commit": {
        post: protectedMutation({
          operationId: "ownerBookingsImportJobCommit",
          path: z.object({ jobId: UuidSchema }),
        }),
      },

      "/owner/import/bookings/rows/{rowId}": {
        patch: protectedMutation({
          operationId: "ownerBookingsImportRowUpdate",
          path: z.object({ rowId: UuidSchema }),
          bodyType: "json",
        }),
        delete: protectedMutation({
          operationId: "ownerBookingsImportRowDelete",
          path: z.object({ rowId: UuidSchema }),
          successSchema: SuccessResponseSchema,
        }),
      },

      "/owner/import/bookings/rows/{rowId}/replace-with-guest": {
        post: protectedMutation({
          operationId: "ownerBookingsImportRowReplaceWithGuest",
          path: z.object({ rowId: UuidSchema }),
          bodyType: "json",
        }),
      },

      "/owner/import/bookings/ai-usage": {
        get: protectedGet({
          operationId: "ownerBookingsImportAiUsage",
        }),
      },

      "/owner/chat/auth": {
        get: protectedGet({
          operationId: "ownerChatGetAuth",
        }),
      },

      "/owner/chat/reservations/{reservationId}/session": {
        get: protectedGet({
          operationId: "ownerReservationChatGetSession",
          path: z.object({ reservationId: UuidSchema }),
        }),
      },

      "/owner/chat/reservations/thread-metas": {
        get: protectedGet({
          operationId: "ownerReservationChatThreadMetas",
          query: OwnerReservationChatThreadMetasQuerySchema,
        }),
      },

      "/owner/chat/reservations/{reservationId}/messages": {
        post: protectedMutation({
          operationId: "ownerReservationChatSendMessage",
          path: z.object({ reservationId: UuidSchema }),
          bodyType: "json",
          successSchema: OkResponseSchema,
        }),
      },

      "/owner/chat/claims/{claimRequestId}/session": {
        get: protectedGet({
          operationId: "ownerSupportChatClaimSession",
          path: z.object({ claimRequestId: UuidSchema }),
        }),
      },

      "/owner/chat/claims/{claimRequestId}/messages": {
        post: protectedMutation({
          operationId: "ownerSupportChatClaimSendMessage",
          path: z.object({ claimRequestId: UuidSchema }),
          bodyType: "json",
          successSchema: OkResponseSchema,
        }),
      },

      "/owner/chat/verifications/{placeVerificationRequestId}/session": {
        get: protectedGet({
          operationId: "ownerSupportChatVerificationSession",
          path: z.object({ placeVerificationRequestId: UuidSchema }),
        }),
      },

      "/owner/chat/verifications/{placeVerificationRequestId}/messages": {
        post: protectedMutation({
          operationId: "ownerSupportChatVerificationSendMessage",
          path: z.object({ placeVerificationRequestId: UuidSchema }),
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
