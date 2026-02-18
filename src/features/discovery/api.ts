"use client";

import type { AppError } from "@/common/errors/app-error";
import { toAppError as defaultToAppError } from "@/common/errors/to-app-error";
import { callTrpcMutation, callTrpcQuery } from "@/common/trpc-client-call";
import { getClientApi, type TrpcClientApi } from "@/trpc/client-api";

export interface IDiscoveryApi {
  mutClaimRequestSubmitClaim: (input?: unknown) => Promise<unknown>;
  mutClaimRequestSubmitGuestRemoval: (input?: unknown) => Promise<unknown>;
  queryAvailabilityGetForCourt: (input?: unknown) => Promise<unknown>;
  queryAvailabilityGetForCourtRange: (input?: unknown) => Promise<unknown>;
  queryAvailabilityGetForPlaceSport: (input?: unknown) => Promise<unknown>;
  queryAvailabilityGetForPlaceSportRange: (input?: unknown) => Promise<unknown>;
  queryCourtGetById: (input?: unknown) => Promise<unknown>;
  queryOrganizationMy: (input?: unknown) => Promise<unknown>;
  queryPlaceGetByIdOrSlug: (input?: unknown) => Promise<unknown>;
  queryPlaceList: (input?: unknown) => Promise<unknown>;
  queryPlaceListSummary: (input?: unknown) => Promise<unknown>;
  querySportList: (input?: unknown) => Promise<unknown>;
  queryPlaceCardMediaByIds: (input?: unknown) => Promise<unknown>;
  queryPlaceCardMetaByIds: (input?: unknown) => Promise<unknown>;
}

export type DiscoveryApiDeps = {
  clientApi?: TrpcClientApi;
  toAppError?: (err: unknown) => AppError;
};

export class DiscoveryApi implements IDiscoveryApi {
  readonly clientApi: TrpcClientApi;
  private readonly toAppError: (err: unknown) => AppError;

  constructor(deps: DiscoveryApiDeps = {}) {
    this.clientApi = deps.clientApi ?? getClientApi();
    this.toAppError = deps.toAppError ?? defaultToAppError;
  }

  mutClaimRequestSubmitClaim = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["claimRequest", "submitClaim"],
      input,
      this.toAppError,
    );

  mutClaimRequestSubmitGuestRemoval = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["claimRequest", "submitGuestRemoval"],
      input,
      this.toAppError,
    );

  queryAvailabilityGetForCourt = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["availability", "getForCourt"],
      input,
      this.toAppError,
    );

  queryAvailabilityGetForCourtRange = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["availability", "getForCourtRange"],
      input,
      this.toAppError,
    );

  queryAvailabilityGetForPlaceSport = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["availability", "getForPlaceSport"],
      input,
      this.toAppError,
    );

  queryAvailabilityGetForPlaceSportRange = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["availability", "getForPlaceSportRange"],
      input,
      this.toAppError,
    );

  queryCourtGetById = async (input?: unknown) =>
    callTrpcQuery(this.clientApi, ["court", "getById"], input, this.toAppError);

  queryOrganizationMy = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["organization", "my"],
      input,
      this.toAppError,
    );

  queryPlaceGetByIdOrSlug = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["place", "getByIdOrSlug"],
      input,
      this.toAppError,
    );

  queryPlaceList = async (input?: unknown) =>
    callTrpcQuery(this.clientApi, ["place", "list"], input, this.toAppError);

  queryPlaceListSummary = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["place", "listSummary"],
      input,
      this.toAppError,
    );

  querySportList = async (input?: unknown) =>
    callTrpcQuery(this.clientApi, ["sport", "list"], input, this.toAppError);

  queryPlaceCardMediaByIds = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["place", "cardMediaByIds"],
      input,
      this.toAppError,
    );

  queryPlaceCardMetaByIds = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["place", "cardMetaByIds"],
      input,
      this.toAppError,
    );
}

export const createDiscoveryApi = (
  deps: DiscoveryApiDeps = {},
): IDiscoveryApi => new DiscoveryApi(deps);

const DISCOVERY_API_SINGLETON = createDiscoveryApi();

export const getDiscoveryApi = (): IDiscoveryApi => DISCOVERY_API_SINGLETON;
