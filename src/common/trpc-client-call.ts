"use client";

import type { AppError } from "@/common/errors/app-error";
import type { TrpcClientApi } from "@/trpc/client-api";

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord | null =>
  value && typeof value === "object" ? (value as UnknownRecord) : null;

const getByPath = (source: unknown, path: readonly string[]): unknown => {
  let current: unknown = source;

  for (const segment of path) {
    const record = asRecord(current);
    if (!record) {
      return undefined;
    }
    current = record[segment];
  }

  return current;
};

export const buildTrpcQueryKey = (
  path: readonly string[],
  input?: unknown,
): readonly unknown[] =>
  input === undefined ? ["trpc", ...path] : ["trpc", ...path, input];

export const callTrpcQuery = async (
  clientApi: TrpcClientApi,
  path: readonly string[],
  input: unknown,
  toAppError: (err: unknown) => AppError,
): Promise<unknown> => {
  const procedure = getByPath(clientApi, path) as UnknownRecord | undefined;
  const query = procedure?.query;

  if (typeof query !== "function") {
    throw new Error(`Missing query handler for procedure: ${path.join(".")}`);
  }

  try {
    return await (query as (value: unknown) => Promise<unknown>)(input);
  } catch (err) {
    throw toAppError(err);
  }
};

export const callTrpcMutation = async (
  clientApi: TrpcClientApi,
  path: readonly string[],
  input: unknown,
  toAppError: (err: unknown) => AppError,
): Promise<unknown> => {
  const procedure = getByPath(clientApi, path) as UnknownRecord | undefined;
  const mutate = procedure?.mutate;

  if (typeof mutate !== "function") {
    throw new Error(
      `Missing mutation handler for procedure: ${path.join(".")}`,
    );
  }

  try {
    return await (mutate as (value: unknown) => Promise<unknown>)(input);
  } catch (err) {
    throw toAppError(err);
  }
};
