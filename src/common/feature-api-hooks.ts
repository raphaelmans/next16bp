"use client";

import {
  type FetchQueryOptions,
  mutationOptions,
  type QueriesResults,
  type Updater,
  type UseMutateFunction,
  type UseMutationOptions,
  type UseMutationResult,
  type UseQueryResult,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import * as React from "react";
import type { AppError } from "@/common/errors/app-error";
import type { FeatureQueryOptions } from "@/common/feature-query-options";
import { buildTrpcQueryKey } from "@/common/trpc-query-key";

type QueryPath = readonly string[];
type FeatureQueryKey = ReturnType<typeof buildTrpcQueryKey>;
type FeatureFetchOptions<TQueryFnData, TData = TQueryFnData> = Omit<
  FetchQueryOptions<TQueryFnData, AppError, TData, FeatureQueryKey>,
  "queryKey" | "queryFn"
>;

type FeatureMutationOptions<TData, TVariables, TOnMutateResult> = Omit<
  UseMutationOptions<TData, AppError, TVariables, TOnMutateResult>,
  "mutationFn"
>;

type MutationResultFor<TData, TVariables, TOnMutateResult> = UseMutationResult<
  TData,
  AppError,
  TVariables,
  TOnMutateResult
>;

type MutationMutateFor<TData, TVariables, TOnMutateResult> = MutationResultFor<
  TData,
  TVariables,
  TOnMutateResult
>["mutate"];

type MutationMutateAsyncFor<TData, TVariables, TOnMutateResult> =
  MutationResultFor<TData, TVariables, TOnMutateResult>["mutateAsync"];

export { createFeatureQueryOptions } from "@/common/feature-query-options";

export function useFeatureQuery<
  TPath extends QueryPath,
  TInput,
  TQueryFnData,
  TData = TQueryFnData,
>(
  path: TPath,
  queryFn: (input?: TInput) => Promise<TQueryFnData>,
  input?: TInput,
  options?: FeatureQueryOptions<TQueryFnData, TData>,
): UseQueryResult<TData, AppError>;
export function useFeatureQuery<TData>(
  path: QueryPath,
  queryFn: (input?: unknown) => Promise<unknown>,
  input?: unknown,
  options?: FeatureQueryOptions<unknown, TData>,
): UseQueryResult<TData, AppError>;
export function useFeatureQuery(
  path: QueryPath,
  queryFn: (input?: unknown) => Promise<unknown>,
  input?: unknown,
  options?: FeatureQueryOptions<unknown, unknown>,
): UseQueryResult<unknown, AppError> {
  return useQuery({
    queryKey: buildTrpcQueryKey(path, input),
    queryFn: () => queryFn(input),
    ...(options ?? {}),
  });
}

export type FeatureMutationResult<
  TData = unknown,
  TVariables = void,
  TOnMutateResult = unknown,
> = Omit<
  MutationResultFor<TData, TVariables, TOnMutateResult>,
  "mutate" | "mutateAsync"
> & {
  mutate: (
    ...args: Parameters<MutationMutateFor<TData, TVariables, TOnMutateResult>>
  ) => ReturnType<MutationMutateFor<TData, TVariables, TOnMutateResult>>;
  mutateAsync: (
    ...args: Parameters<
      MutationMutateAsyncFor<TData, TVariables, TOnMutateResult>
    >
  ) => ReturnType<MutationMutateAsyncFor<TData, TVariables, TOnMutateResult>>;
};

export function useFeatureMutation<
  TData = unknown,
  TInput = void,
  TOnMutateResult = unknown,
>(
  mutationFn: (input: TInput) => Promise<TData>,
  options?: FeatureMutationOptions<TData, TInput, TOnMutateResult>,
): FeatureMutationResult<TData, TInput, TOnMutateResult> {
  const mutation = useMutation<TData, AppError, TInput, TOnMutateResult>(
    mutationOptions<TData, AppError, TInput, TOnMutateResult>({
      mutationFn: (input: TInput) => mutationFn(input),
      ...(options ?? {}),
    }),
  );

  return {
    ...mutation,
    mutate: (
      ...args: Parameters<MutationMutateFor<TData, TInput, TOnMutateResult>>
    ) => mutation.mutate(...args),
    mutateAsync: (
      ...args: Parameters<
        MutationMutateAsyncFor<TData, TInput, TOnMutateResult>
      >
    ) => mutation.mutateAsync(...args),
  };
}

export type FeatureMutateFunction<
  TData = unknown,
  TVariables = void,
  TOnMutateResult = unknown,
> = (
  ...args: Parameters<
    UseMutateFunction<TData, AppError, TVariables, TOnMutateResult>
  >
) => ReturnType<
  UseMutateFunction<TData, AppError, TVariables, TOnMutateResult>
>;

type MutableQueryTuple<T extends readonly unknown[]> = {
  -readonly [K in keyof T]: T[K];
};

export function useFeatureQueries<TQueries extends readonly unknown[]>(
  queries: readonly [...TQueries],
): QueriesResults<MutableQueryTuple<TQueries>> {
  return useQueries({
    queries: queries as Parameters<typeof useQueries>[0]["queries"],
  }) as QueriesResults<MutableQueryTuple<TQueries>>;
}

export function useFeatureQueryCache() {
  const queryClient = useQueryClient();

  return React.useMemo(() => {
    const getQueryKey = (path: QueryPath, input?: unknown): FeatureQueryKey =>
      buildTrpcQueryKey(path, input);

    return {
      // biome-ignore lint/suspicious/noExplicitAny: cache operations are untyped at the key level
      setData: (path: QueryPath, input: unknown, updater: Updater<any, any>) =>
        queryClient.setQueryData(getQueryKey(path, input), updater),

      getData: <T = unknown>(path: QueryPath, input: unknown): T | undefined =>
        queryClient.getQueryData<T>(getQueryKey(path, input)),

      cancel: (path: QueryPath, input: unknown) =>
        queryClient.cancelQueries({
          queryKey: getQueryKey(path, input),
        }),

      invalidate: (path: QueryPath, input?: unknown) =>
        queryClient.invalidateQueries({
          queryKey: getQueryKey(path, input),
        }),

      fetch: <T>(
        path: QueryPath,
        input: unknown,
        queryFn: () => Promise<T>,
        options?: FeatureFetchOptions<T>,
      ) =>
        queryClient.fetchQuery<T, AppError, T, FeatureQueryKey>({
          queryKey: getQueryKey(path, input),
          queryFn,
          ...(options ?? {}),
        }),
    };
  }, [queryClient]);
}
