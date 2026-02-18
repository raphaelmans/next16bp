"use client";

import type { AppError } from "@/common/errors/app-error";
import { toAppError as defaultToAppError } from "@/common/errors/to-app-error";
import { callTrpcMutation } from "@/common/trpc-client-call";
import { getClientApi, type TrpcClientApi } from "@/trpc/client-api";

export interface IOrganizationApi {
  mutOrganizationCreate: (input?: unknown) => Promise<unknown>;
}

export type OrganizationApiDeps = {
  clientApi?: TrpcClientApi;
  toAppError?: (err: unknown) => AppError;
};

export class OrganizationApi implements IOrganizationApi {
  readonly clientApi: TrpcClientApi;
  private readonly toAppError: (err: unknown) => AppError;

  constructor(deps: OrganizationApiDeps = {}) {
    this.clientApi = deps.clientApi ?? getClientApi();
    this.toAppError = deps.toAppError ?? defaultToAppError;
  }

  mutOrganizationCreate = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["organization", "create"],
      input,
      this.toAppError,
    );
}

export const createOrganizationApi = (
  deps: OrganizationApiDeps = {},
): IOrganizationApi => new OrganizationApi(deps);

const ORGANIZATION_API_SINGLETON = createOrganizationApi();

export const getOrganizationApi = (): IOrganizationApi =>
  ORGANIZATION_API_SINGLETON;
