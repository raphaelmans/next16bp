"use client";

import type { AppError } from "@/common/errors/app-error";
import type { TrpcClientApi } from "@/trpc/client-api";

type QueryInvoker<TOutput> =
  | ((clientApi: TrpcClientApi) => {
      bivarianceHack(input: unknown): Promise<TOutput>;
    }["bivarianceHack"])
  | null
  | undefined;

type MutationInvoker<TOutput> =
  | ((clientApi: TrpcClientApi) => {
      bivarianceHack(input: unknown): Promise<TOutput>;
    }["bivarianceHack"])
  | null
  | undefined;

export const buildTrpcQueryKey = (
  path: readonly string[],
  input?: unknown,
): readonly unknown[] =>
  input === undefined ? ["trpc", ...path] : ["trpc", ...path, input];

export const callTrpcQuery = async <TInput, TOutput>(
  clientApi: TrpcClientApi,
  path: readonly string[],
  invoker: QueryInvoker<TOutput>,
  input: TInput,
  toAppError: (err: unknown) => AppError,
): Promise<TOutput> => {
  if (!invoker) {
    throw new Error(`Missing query handler for procedure: ${path.join(".")}`);
  }

  const query = invoker(clientApi);

  try {
    return await query(input);
  } catch (err) {
    throw toAppError(err);
  }
};

export const callTrpcMutation = async <TInput, TOutput>(
  clientApi: TrpcClientApi,
  path: readonly string[],
  invoker: MutationInvoker<TOutput>,
  input: TInput,
  toAppError: (err: unknown) => AppError,
): Promise<TOutput> => {
  if (!invoker) {
    throw new Error(
      `Missing mutation handler for procedure: ${path.join(".")}`,
    );
  }

  const mutate = invoker(clientApi);

  try {
    return await mutate(input);
  } catch (err) {
    throw toAppError(err);
  }
};
