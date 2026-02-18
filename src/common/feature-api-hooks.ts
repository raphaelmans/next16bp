"use client";

import {
  type UseMutateFunction,
  type UseMutationResult,
  type UseQueryResult,
  useMutation,
  useQueries,
  useQuery,
} from "@tanstack/react-query";
import type { AppError } from "@/common/errors/app-error";
import { buildTrpcQueryKey } from "@/common/trpc-client-call";

type QueryOptions = Record<string, unknown> | undefined;
type MutationOptions = Record<string, unknown> | undefined;

export const createFeatureQueryOptions = <TData = any>(
  path: readonly string[],
  queryFn: (input?: unknown) => Promise<unknown>,
  input?: unknown,
  options?: QueryOptions,
) =>
  ({
    queryKey: buildTrpcQueryKey(path, input),
    queryFn: () => queryFn(input),
    ...(options ?? {}),
  }) as never;

export const useFeatureQuery = <TData = any>(
  path: readonly string[],
  queryFn: (input?: unknown) => Promise<unknown>,
  input?: unknown,
  options?: QueryOptions,
) =>
  useQuery({
    queryKey: buildTrpcQueryKey(path, input),
    queryFn: () => queryFn(input),
    ...(options ?? {}),
  } as never) as UseQueryResult<TData, AppError>;

export type FeatureMutationResult<TData = any> = Omit<
  UseMutationResult<TData, AppError, unknown, unknown>,
  "mutate" | "mutateAsync"
> & {
  mutate: (
    input?: unknown,
    options?: Parameters<
      UseMutationResult<TData, AppError, unknown, unknown>["mutate"]
    >[1],
  ) => void;
  mutateAsync: (
    input?: unknown,
    options?: Parameters<
      UseMutationResult<TData, AppError, unknown, unknown>["mutateAsync"]
    >[1],
  ) => Promise<TData>;
};

export const useFeatureMutation = <TData = any>(
  mutationFn: (input?: unknown) => Promise<unknown>,
  options?: MutationOptions,
) => {
  const mutation = useMutation({
    mutationFn: (input: unknown) => mutationFn(input),
    ...(options ?? {}),
  } as never) as UseMutationResult<TData, AppError, unknown, unknown>;

  return {
    ...mutation,
    mutate: (input?: unknown, mutateOptions?: Parameters<typeof mutation.mutate>[1]) => {
      mutation.mutate(input, mutateOptions);
    },
    mutateAsync: (
      input?: unknown,
      mutateOptions?: Parameters<typeof mutation.mutateAsync>[1],
    ) => mutation.mutateAsync(input, mutateOptions),
  } as FeatureMutationResult<TData>;
};

export type FeatureMutateFunction<TData = any> = (
  input?: unknown,
  options?: Parameters<UseMutateFunction<TData, AppError, unknown, unknown>>[1],
) => void;

export const useFeatureQueries = (queries: unknown[]) =>
  useQueries({
    queries: queries as never,
  }) as any[];
