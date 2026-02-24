import "zod-openapi";
import { z } from "zod";
import { createDocument } from "zod-openapi";
import {
  GoogleLocNearbyRequestSchema,
  GoogleLocNearbyResponseSchema,
  GoogleLocPreviewRequestSchema,
  GoogleLocPreviewResponseSchema,
} from "@/lib/modules/google-loc/dtos";

const ApiErrorResponseSchema = z.object({
  code: z.string(),
  message: z.string(),
  requestId: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
});

const GoogleLocPreviewEnvelopeSchema = z.object({
  data: GoogleLocPreviewResponseSchema,
});

const GoogleLocNearbyEnvelopeSchema = z.object({
  data: GoogleLocNearbyResponseSchema,
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
    "502": {
      description: "Bad gateway",
      content: {
        "application/json": {
          schema: ApiErrorResponseSchema,
        },
      },
    },
  };
}

function jsonRequestBody(schema: z.ZodTypeAny) {
  return {
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema,
        },
      },
    },
  };
}

function authenticatedPost(options: {
  operationId: string;
  bodySchema: z.ZodTypeAny;
  successSchema: z.ZodTypeAny;
  summary: string;
}) {
  return {
    operationId: options.operationId,
    summary: options.summary,
    description:
      "Requires an authenticated browser session or Bearer token with admin or member role.",
    ...jsonRequestBody(options.bodySchema),
    responses: responses(options.successSchema),
  };
}

export function createGoogleLocV1OpenApiDocument(args: { baseUrl: string }) {
  return createDocument({
    openapi: "3.1.0",
    info: {
      title: "KudosCourts Google Location API",
      version: "1.0.0",
    },
    servers: [{ url: `${args.baseUrl}/api/v1` }],
    paths: {
      "/google-loc/preview": {
        post: authenticatedPost({
          operationId: "googleLocPreview",
          summary:
            "Resolve a Google Maps URL into map coordinates and embed URL",
          bodySchema: GoogleLocPreviewRequestSchema,
          successSchema: GoogleLocPreviewEnvelopeSchema,
        }),
      },
      "/google-loc/nearby": {
        post: authenticatedPost({
          operationId: "googleLocNearby",
          summary: "Find nearby places around a coordinate",
          bodySchema: GoogleLocNearbyRequestSchema,
          successSchema: GoogleLocNearbyEnvelopeSchema,
        }),
      },
    },
  });
}
