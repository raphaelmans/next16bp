"use client";

import type { AppError } from "@/common/errors/app-error";
import { toAppError as defaultToAppError } from "@/common/errors/to-app-error";
import { callTrpcMutation, callTrpcQuery } from "@/common/trpc-client-call";
import { getClientApi, type TrpcClientApi } from "@/trpc/client-api";

export interface ICourtAddonsApi {
  queryCourtAddonGet: (input?: unknown) => Promise<unknown>;
  queryPlaceAddonGet: (input?: unknown) => Promise<unknown>;
  mutCourtAddonSet: (input?: unknown) => Promise<unknown>;
}

export type CourtAddonsApiDeps = {
  clientApi?: TrpcClientApi;
  toAppError?: (err: unknown) => AppError;
};

export class CourtAddonsApi {
  readonly clientApi: TrpcClientApi;
  private readonly toAppError: (err: unknown) => AppError;

  constructor(deps: CourtAddonsApiDeps = {}) {
    this.clientApi = deps.clientApi ?? getClientApi();
    this.toAppError = deps.toAppError ?? defaultToAppError;
  }

  queryCourtAddonGet = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["courtAddon", "get"],
      (clientApi) => clientApi.courtAddon.get.query,
      input,
      this.toAppError,
    );

  queryPlaceAddonGet = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["placeAddon", "get"],
      (clientApi) => clientApi.placeAddon.get.query,
      input,
      this.toAppError,
    );

  mutCourtAddonSet = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["courtAddon", "set"],
      (clientApi) => clientApi.courtAddon.set.mutate,
      input,
      this.toAppError,
    );
}

export const createCourtAddonsApi = (deps: CourtAddonsApiDeps = {}) =>
  new CourtAddonsApi(deps);

const COURT_ADDONS_API_SINGLETON = createCourtAddonsApi();

export const getCourtAddonsApi = () => COURT_ADDONS_API_SINGLETON;
