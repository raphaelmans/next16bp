"use client";

import type { AppError } from "@/common/errors/app-error";
import { toAppError as defaultToAppError } from "@/common/errors/to-app-error";
import { callTrpcQuery } from "@/common/trpc-client-call";
import { getClientApi, type TrpcClientApi } from "@/trpc/client-api";

export interface IHomeApi {
  queryOrganizationMy: (input?: unknown) => Promise<unknown>;
  queryPlaceStats: (input?: unknown) => Promise<unknown>;
  queryProfileMe: (input?: unknown) => Promise<unknown>;
  queryReservationGetMyWithDetails: (input?: unknown) => Promise<unknown>;
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

  queryOrganizationMy = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["organization", "my"],
      (clientApi) => clientApi.organization.my.query,
      input,
      this.toAppError,
    );

  queryPlaceStats = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["place", "stats"],
      (clientApi) => clientApi.place.stats.query,
      input,
      this.toAppError,
    );

  queryProfileMe = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["profile", "me"],
      (clientApi) => clientApi.profile.me.query,
      input,
      this.toAppError,
    );

  queryReservationGetMyWithDetails = async (input?: unknown) =>
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
