"use client";

import ky from "ky";
import type { z } from "zod";
import type { ApiErrorResponse } from "@/lib/shared/kernel/response";

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

const developersKy = ky.create({
  throwHttpErrors: false,
  timeout: 30_000,
});

type RequestOptions = {
  signal?: AbortSignal;
  json?: unknown;
};

export interface IOrganizationDevelopersClient {
  get<T>(
    path: string,
    schema: z.ZodType<T>,
    options?: RequestOptions,
  ): Promise<T>;
  post<T>(
    path: string,
    schema: z.ZodType<T>,
    options?: RequestOptions,
  ): Promise<T>;
  put<T>(
    path: string,
    schema: z.ZodType<T>,
    options?: RequestOptions,
  ): Promise<T>;
  delete<T>(
    path: string,
    schema: z.ZodType<T>,
    options?: RequestOptions,
  ): Promise<T>;
}

async function parseResponse<T>(
  response: Response,
  schema: z.ZodType<T>,
): Promise<T> {
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

  const parsed = schema.safeParse(json);
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

  return parsed.data;
}

export class OrganizationDevelopersClient
  implements IOrganizationDevelopersClient
{
  async get<T>(
    path: string,
    schema: z.ZodType<T>,
    options?: RequestOptions,
  ): Promise<T> {
    const response = await developersKy.get(path, {
      signal: options?.signal,
      cache: "no-store",
    });
    return parseResponse(response, schema);
  }

  async post<T>(
    path: string,
    schema: z.ZodType<T>,
    options?: RequestOptions,
  ): Promise<T> {
    const response = await developersKy.post(path, {
      signal: options?.signal,
      json: options?.json,
    });
    return parseResponse(response, schema);
  }

  async put<T>(
    path: string,
    schema: z.ZodType<T>,
    options?: RequestOptions,
  ): Promise<T> {
    const response = await developersKy.put(path, {
      signal: options?.signal,
      json: options?.json,
    });
    return parseResponse(response, schema);
  }

  async delete<T>(
    path: string,
    schema: z.ZodType<T>,
    options?: RequestOptions,
  ): Promise<T> {
    const response = await developersKy.delete(path, {
      signal: options?.signal,
      json: options?.json,
    });
    return parseResponse(response, schema);
  }
}

export const createOrganizationDevelopersClient = () =>
  new OrganizationDevelopersClient();

const ORGANIZATION_DEVELOPERS_CLIENT_SINGLETON =
  createOrganizationDevelopersClient();

export const getOrganizationDevelopersClient = () =>
  ORGANIZATION_DEVELOPERS_CLIENT_SINGLETON;
