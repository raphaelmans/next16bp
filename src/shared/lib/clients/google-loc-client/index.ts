"use client";

import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import ky from "ky";

import type { ApiErrorResponse, ApiResponse } from "@/shared/kernel/response";

import { googleLocQueryKeys } from "./query-keys";

export type GoogleLocSource = "marker" | "center";

export interface GoogleLocResult {
  inputUrl: string;
  resolvedUrl?: string;
  suggestedName?: string;
  lat?: number;
  lng?: number;
  zoom?: number;
  source?: GoogleLocSource;
  embedSrc?: string;
  warnings: string[];
}

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
