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

export const createFeatureQueryOptions = <TData>(
  path: readonly string[],
  queryFn: (input?: unknown) => Promise<TData>,
  input?: unknown,
  options?: QueryOptions,
) =>
  ({
    queryKey: buildTrpcQueryKey(path, input),
    queryFn: () => queryFn(input),
    ...(options ?? {}),
  }) as never;

export const useFeatureQuery = <TData>(
  path: readonly string[],
  queryFn: (input?: unknown) => Promise<TData>,
  input?: unknown,
  options?: QueryOptions,
) =>
  useQuery({
    queryKey: buildTrpcQueryKey(path, input),
    queryFn: () => queryFn(input),
    ...(options ?? {}),
  } as never) as UseQueryResult<TData, AppError>;

export const useFeatureMutation = <TData>(
  mutationFn: (input?: unknown) => Promise<TData>,
  options?: MutationOptions,
) =>
  useMutation({
    mutationFn: (input: unknown) => mutationFn(input),
    ...(options ?? {}),
  } as never) as UseMutationResult<TData, AppError, unknown, unknown>;

export type FeatureMutateFunction<TData = unknown> = UseMutateFunction<
  TData,
  AppError,
  unknown,
  unknown
>;

export const useFeatureQueries = <T extends unknown[]>(queries: T) =>
  useQueries({
    queries: queries as never,
  }) as unknown as T;
