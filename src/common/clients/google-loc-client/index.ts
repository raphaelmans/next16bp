"use client";

import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import ky from "ky";

import type {
  ApiErrorResponse,
  ApiResponse,
} from "@/lib/shared/kernel/response";

import { googleLocQueryKeys } from "./query-keys";

export type GoogleLocSource = "marker" | "center";

export interface GoogleLocResult {
  inputUrl: string;
  resolvedUrl?: string;
  suggestedName?: string;
  placeId?: string;
  lat?: number;
  lng?: number;
  zoom?: number;
  source?: GoogleLocSource;
  embedSrc?: string;
  warnings: string[];
}

export type GoogleLocNearbyPlace = {
  id: string;
  name: string;
};

export type GoogleLocNearbyResult = {
  places: GoogleLocNearbyPlace[];
};

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

export const isApiClientError = (error: unknown): error is ApiClientError =>
  error instanceof ApiClientError;

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

const isApiResponse = <T>(value: unknown): value is ApiResponse<T> =>
  isRecord(value) && "data" in value;

const isNearbyResult = (value: unknown): value is GoogleLocNearbyResult => {
  if (!isRecord(value)) return false;
  if (!Array.isArray(value.places)) return false;
  return value.places.every(
    (place) =>
      isRecord(place) &&
      typeof place.id === "string" &&
      typeof place.name === "string",
  );
};

const googleLocKy = ky.create({
  throwHttpErrors: false,
  timeout: 30_000,
});

export const googleLocClient = {
  async preview(args: {
    url: string;
    signal?: AbortSignal;
  }): Promise<GoogleLocResult> {
    const response = await googleLocKy.post("/api/poc/google-loc", {
      json: { url: args.url },
      signal: args.signal,
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

    if (!isApiResponse<GoogleLocResult>(json)) {
      throw new ApiClientError({
        code: "INTERNAL_ERROR",
        message: "Invalid response",
        requestId: "unknown",
        httpStatus: response.status,
      });
    }

    return json.data;
  },
  async nearby(args: {
    lat: number;
    lng: number;
    radius?: number;
    max?: number;
    signal?: AbortSignal;
  }): Promise<GoogleLocNearbyResult> {
    const response = await googleLocKy.post("/api/poc/google-loc/nearby", {
      json: {
        lat: args.lat,
        lng: args.lng,
        radius: args.radius,
        max: args.max,
      },
      signal: args.signal,
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

    if (!isApiResponse<GoogleLocNearbyResult>(json)) {
      throw new ApiClientError({
        code: "INTERNAL_ERROR",
        message: "Invalid response",
        requestId: "unknown",
        httpStatus: response.status,
      });
    }

    if (!isNearbyResult(json.data)) {
      throw new ApiClientError({
        code: "INTERNAL_ERROR",
        message: "Invalid response",
        requestId: "unknown",
        httpStatus: response.status,
      });
    }

    return json.data;
  },
};

export function useGoogleLocPreviewMutation(
  options?: UseMutationOptions<
    GoogleLocResult,
    ApiClientError,
    { url: string },
    unknown
  >,
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationKey: googleLocQueryKeys.preview._def,
    mutationFn: ({ url }: { url: string }) => googleLocClient.preview({ url }),
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.setQueryData(
        googleLocQueryKeys.preview(variables.url).queryKey,
        data,
      );

      onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}

export function useGoogleLocNearbyMutation(
  options?: UseMutationOptions<
    GoogleLocNearbyResult,
    ApiClientError,
    { lat: number; lng: number; radius?: number; max?: number },
    unknown
  >,
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationKey: googleLocQueryKeys.nearby._def,
    mutationFn: (args) => googleLocClient.nearby(args),
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.setQueryData(
        googleLocQueryKeys.nearby(variables).queryKey,
        data,
      );

      onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
