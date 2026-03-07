import { queryOptions, type UseQueryOptions } from "@tanstack/react-query";
import type { AppError } from "@/common/errors/app-error";
import { buildTrpcQueryKey } from "@/common/trpc-query-key";

type FeatureQueryKey = ReturnType<typeof buildTrpcQueryKey>;
type QueryPath = readonly string[];

export type FeatureQueryOptions<TQueryFnData, TData = TQueryFnData> = Omit<
  UseQueryOptions<TQueryFnData, AppError, TData, FeatureQueryKey>,
  "queryKey" | "queryFn"
>;

export const createFeatureQueryOptions = <
  TPath extends QueryPath,
  TInput,
  TQueryFnData,
  TData = TQueryFnData,
>(
  path: TPath,
  queryFn: (input?: TInput) => Promise<TQueryFnData>,
  input?: TInput,
  options?: FeatureQueryOptions<TQueryFnData, TData>,
): UseQueryOptions<TQueryFnData, AppError, TData, FeatureQueryKey> =>
  queryOptions<TQueryFnData, AppError, TData, FeatureQueryKey>({
    queryKey: buildTrpcQueryKey(path, input),
    queryFn: () => queryFn(input),
    ...(options ?? {}),
  });
