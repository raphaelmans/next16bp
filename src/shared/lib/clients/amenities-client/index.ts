"use client";

import { useQuery } from "@tanstack/react-query";
import ky from "ky";

import type { ApiErrorResponse } from "@/shared/kernel/response";
import { amenitiesQueryKeys } from "./query-keys";
import { amenitiesResponseSchema } from "./schemas";

export class ApiClientError extends Error {
  readonly code: string;
  readonly requestId: string;
  readonly httpStatus: number;
  readonly details?: Record<string, unknown>;

  constructor(args: {
    code: string;
    message: string;
    requestId: string;
    httpStatus: number;
    details?: Record<string, unknown>;
  }) {
    super(args.message);
    this.name = "ApiClientError";
    this.code = args.code;
    this.requestId = args.requestId;
    this.httpStatus = args.httpStatus;
    this.details = args.details;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isApiErrorResponse = (value: unknown): value is ApiErrorResponse => {
  if (!isRecord(value)) return false;
  return (
    typeof value.code === "string" &&
    typeof value.message === "string" &&
    typeof value.requestId === "string"
  );
};

const amenitiesKy = ky.create({
  throwHttpErrors: false,
  timeout: 30_000,
});

export const amenitiesClient = {
  async list(args?: { signal?: AbortSignal }): Promise<string[]> {
    const response = await amenitiesKy.get("/api/public/amenities", {
      signal: args?.signal,
      cache: "no-store",
    });

    const json = (await response.json()) as unknown;

    if (!response.ok) {
      if (isApiErrorResponse(json)) {
        throw new ApiClientError({
          code: json.code,
          message: json.message,
          requestId: json.requestId,
          httpStatus: response.status,
          details: json.details,
        });
      }

      throw new ApiClientError({
        code: "INTERNAL_ERROR",
        message: "Request failed",
        requestId: "unknown",
        httpStatus: response.status,
      });
    }

    const parsed = amenitiesResponseSchema.safeParse(json);
    if (!parsed.success) {
      throw new ApiClientError({
        code: "INTERNAL_ERROR",
        message: "Invalid response",
        requestId: "unknown",
        httpStatus: response.status,
        details: {
          error: parsed.error.flatten(),
        },
      });
    }

    return parsed.data.data;
  },
};

export function useAmenitiesQuery() {
  return useQuery({
    queryKey: amenitiesQueryKeys.list.queryKey,
    queryFn: ({ signal }) => amenitiesClient.list({ signal }),
    staleTime: 5 * 60 * 1000,
  });
}
