"use client";

import type { AppError } from "@/common/errors/app-error";
import { toAppError as defaultToAppError } from "@/common/errors/to-app-error";
import { callTrpcQuery } from "@/common/trpc-client-call";
import { getClientApi, type TrpcClientApi } from "@/trpc/client-api";

type ProcedureFn<TProcedure> = TProcedure extends (
  input: infer TInput,
  ...rest: infer _TRest
) => Promise<infer TResult>
  ? (input?: TInput) => Promise<TResult>
  : never;

export interface IHomeApi {
  queryOrganizationMy: ProcedureFn<
    TrpcClientApi["organization"]["my"]["query"]
  >;
  queryPlaceStats: ProcedureFn<TrpcClientApi["place"]["stats"]["query"]>;
  queryProfileMe: ProcedureFn<TrpcClientApi["profile"]["me"]["query"]>;
  queryReservationGetMyWithDetails: ProcedureFn<
    TrpcClientApi["reservation"]["getMyWithDetails"]["query"]
  >;
}

export type HomeApiDeps = {
  clientApi?: TrpcClientApi;
  toAppError?: (err: unknown) => AppError;
};

export class HomeApi {
  readonly clientApi: TrpcClientApi;
  private readonly toAppError: (err: unknown) => AppError;

  constructor(deps: HomeApiDeps = {}) {
    this.clientApi = deps.clientApi ?? getClientApi();
    this.toAppError = deps.toAppError ?? defaultToAppError;
  }

  queryOrganizationMy: ProcedureFn<
    TrpcClientApi["organization"]["my"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["organization", "my"],
      (clientApi) => clientApi.organization.my.query,
      input,
      this.toAppError,
    );

  queryPlaceStats: ProcedureFn<TrpcClientApi["place"]["stats"]["query"]> =
    async (input) =>
      callTrpcQuery(
        this.clientApi,
        ["place", "stats"],
        (clientApi) => clientApi.place.stats.query,
        input,
        this.toAppError,
      );

  queryProfileMe: ProcedureFn<TrpcClientApi["profile"]["me"]["query"]> = async (
    input,
  ) =>
    callTrpcQuery(
      this.clientApi,
      ["profile", "me"],
      (clientApi) => clientApi.profile.me.query,
      input,
      this.toAppError,
    );

  queryReservationGetMyWithDetails: ProcedureFn<
    TrpcClientApi["reservation"]["getMyWithDetails"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["reservation", "getMyWithDetails"],
      (clientApi) => clientApi.reservation.getMyWithDetails.query,
      input,
      this.toAppError,
    );
}

export const createHomeApi = (deps: HomeApiDeps = {}) => new HomeApi(deps);

const HOME_API_SINGLETON = createHomeApi();

export const getHomeApi = () => HOME_API_SINGLETON;
