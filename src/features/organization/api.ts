"use client";

import type { AppError } from "@/common/errors/app-error";
import { toAppError as defaultToAppError } from "@/common/errors/to-app-error";
import { callTrpcMutation } from "@/common/trpc-client-call";
import { getClientApi, type TrpcClientApi } from "@/trpc/client-api";
import type { RouterInputs, RouterOutputs } from "@/trpc/types";

export interface IOrganizationApi {
  mutOrganizationCreate: (
    input: RouterInputs["organization"]["create"],
  ) => Promise<RouterOutputs["organization"]["create"]>;
}

export type OrganizationApiDeps = {
  clientApi?: TrpcClientApi;
  toAppError?: (err: unknown) => AppError;
};

export class OrganizationApi {
  readonly clientApi: TrpcClientApi;
  private readonly toAppError: (err: unknown) => AppError;

  constructor(deps: OrganizationApiDeps = {}) {
    this.clientApi = deps.clientApi ?? getClientApi();
    this.toAppError = deps.toAppError ?? defaultToAppError;
  }

  mutOrganizationCreate = async (
    input: RouterInputs["organization"]["create"],
  ) =>
    callTrpcMutation(
      this.clientApi,
      ["organization", "create"],
      (clientApi) => clientApi.organization.create.mutate,
      input,
      this.toAppError,
    );
}

export const createOrganizationApi = (deps: OrganizationApiDeps = {}) =>
  new OrganizationApi(deps);

const ORGANIZATION_API_SINGLETON = createOrganizationApi();

export const getOrganizationApi = () => ORGANIZATION_API_SINGLETON;
