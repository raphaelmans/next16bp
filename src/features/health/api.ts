"use client";

import type { AppError } from "@/common/errors/app-error";
import { toAppError as defaultToAppError } from "@/common/errors/to-app-error";
import { callTrpcQuery } from "@/common/trpc-client-call";
import { getClientApi, type TrpcClientApi } from "@/trpc/client-api";
import type { RouterInputs, RouterOutputs } from "@/trpc/types";

export type HealthCheckInput = RouterInputs["health"]["check"];
export type HealthCheckOutput = RouterOutputs["health"]["check"];

export interface IHealthApi {
  queryHealthCheck: (input?: unknown) => Promise<unknown>;
}

export type HealthApiDeps = {
  clientApi?: TrpcClientApi;
  toAppError?: (err: unknown) => AppError;
};

export class HealthApi {
  readonly clientApi: TrpcClientApi;
  private readonly toAppError: (err: unknown) => AppError;

  constructor(deps: HealthApiDeps = {}) {
    this.clientApi = deps.clientApi ?? getClientApi();
    this.toAppError = deps.toAppError ?? defaultToAppError;
  }

  queryHealthCheck = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["health", "check"],
      (clientApi) => clientApi.health.check.query,
      input,
      this.toAppError,
    );
}

export const createHealthApi = (deps: HealthApiDeps = {}) =>
  new HealthApi(deps);

const HEALTH_API_SINGLETON = createHealthApi();

export const getHealthApi = () => HEALTH_API_SINGLETON;
