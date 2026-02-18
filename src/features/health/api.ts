"use client";

import type { AppError } from "@/common/errors/app-error";
import { toAppError as defaultToAppError } from "@/common/errors/to-app-error";
import { callTrpcQuery } from "@/common/trpc-client-call";
import { getClientApi, type TrpcClientApi } from "@/trpc/client-api";

export interface IHealthApi {
  queryHealthCheck: (input?: unknown) => Promise<unknown>;
}

export type HealthApiDeps = {
  clientApi?: TrpcClientApi;
  toAppError?: (err: unknown) => AppError;
};

export class HealthApi implements IHealthApi {
  readonly clientApi: TrpcClientApi;
  private readonly toAppError: (err: unknown) => AppError;

  constructor(deps: HealthApiDeps = {}) {
    this.clientApi = deps.clientApi ?? getClientApi();
    this.toAppError = deps.toAppError ?? defaultToAppError;
  }

  queryHealthCheck = async (input?: unknown) =>
    callTrpcQuery(this.clientApi, ["health", "check"], input, this.toAppError);
}

export const createHealthApi = (deps: HealthApiDeps = {}): IHealthApi =>
  new HealthApi(deps);

const HEALTH_API_SINGLETON = createHealthApi();

export const getHealthApi = (): IHealthApi => HEALTH_API_SINGLETON;
