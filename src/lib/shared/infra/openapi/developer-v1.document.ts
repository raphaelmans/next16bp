import "zod-openapi";
import { z } from "zod";
import { createDocument } from "zod-openapi";

const ApiErrorResponseSchema = z.object({
  code: z.string(),
  message: z.string(),
  requestId: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
});

const AvailabilityOptionSchema = z
  .object({
    courtId: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    status: z.string(),
    unavailableReason: z.string().nullable().optional(),
    totalPriceCents: z.number().nullable().optional(),
    currency: z.string().nullable().optional(),
  })
  .passthrough();

const AvailabilityDiagnosticsSchema = z
  .object({
    hasHoursWindows: z.boolean(),
    hasRateRules: z.boolean(),
    dayHasHours: z.boolean(),
    allSlotsBooked: z.boolean(),
    reservationsDisabled: z.boolean().optional(),
  })
  .passthrough();

const DeveloperAvailabilityResponseSchema = z.object({
  data: z.object({
    options: z.array(AvailabilityOptionSchema),
    diagnostics: AvailabilityDiagnosticsSchema,
  }),
});

const DeveloperUnavailabilityResponseSchema = z.object({
  data: z.object({
    externalCourtId: z.string(),
    externalWindowId: z.string(),
    courtBlockId: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    status: z.literal("ACTIVE"),
    syncedAt: z.string(),
  }),
});

const DeveloperDeleteUnavailabilityResponseSchema = z.object({
  data: z.object({
    success: z.literal(true),
    externalCourtId: z.string(),
    externalWindowId: z.string(),
    status: z.literal("CANCELED"),
  }),
});

const DeveloperAvailabilityQuerySchema = z.object({
  date: z.string(),
  durationMinutes: z.number().int(),
  includeUnavailable: z.boolean().optional(),
});

const DeveloperCourtPathSchema = z.object({
  externalCourtId: z.string(),
});

const DeveloperUnavailabilityPathSchema = z.object({
  externalCourtId: z.string(),
  externalWindowId: z.string(),
});

const DeveloperUnavailabilityBodySchema = z.object({
  startTime: z.string(),
  endTime: z.string(),
  reason: z.string().optional(),
});

function responses(successSchema: z.ZodTypeAny) {
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

export function createDeveloperV1OpenApiDocument(args: {
  baseUrl: string;
  basePath?: string;
}) {
  return createDocument({
    openapi: "3.1.0",
    info: {
      title: "KudosCourts Developer API",
      version: "1.0.0",
    },
    servers: [
      { url: `${args.baseUrl}${args.basePath ?? "/api/developer/v1"}` },
    ],
    components: {
      securitySchemes: {
        developerApiKey: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
        },
      },
    },
    paths: {
      "/courts/{externalCourtId}/availability": {
        get: {
          operationId: "developerAvailabilityGetForCourt",
          security: [{ developerApiKey: [] }],
          requestParams: {
            path: DeveloperCourtPathSchema,
            query: DeveloperAvailabilityQuerySchema,
          },
          responses: responses(DeveloperAvailabilityResponseSchema),
        },
      },
      "/courts/{externalCourtId}/unavailability/{externalWindowId}": {
        put: {
          operationId: "developerUnavailabilityUpsert",
          security: [{ developerApiKey: [] }],
          requestParams: {
            path: DeveloperUnavailabilityPathSchema,
          },
          requestBody: {
            content: {
              "application/json": {
                schema: DeveloperUnavailabilityBodySchema,
              },
            },
          },
          responses: responses(DeveloperUnavailabilityResponseSchema),
        },
        delete: {
          operationId: "developerUnavailabilityDelete",
          security: [{ developerApiKey: [] }],
          requestParams: {
            path: DeveloperUnavailabilityPathSchema,
          },
          responses: responses(DeveloperDeleteUnavailabilityResponseSchema),
        },
      },
    },
  });
}
