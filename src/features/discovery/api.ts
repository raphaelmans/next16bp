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

export class DiscoveryApi {
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
      (clientApi) => clientApi.claimRequest.submitClaim.mutate,
      input,
      this.toAppError,
    );

  mutClaimRequestSubmitGuestRemoval = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["claimRequest", "submitGuestRemoval"],
      (clientApi) => clientApi.claimRequest.submitGuestRemoval.mutate,
      input,
      this.toAppError,
    );

  queryAvailabilityGetForCourt = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["availability", "getForCourt"],
      (clientApi) => clientApi.availability.getForCourt.query,
      input,
      this.toAppError,
    );

  queryAvailabilityGetForCourtRange = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["availability", "getForCourtRange"],
      (clientApi) => clientApi.availability.getForCourtRange.query,
      input,
      this.toAppError,
    );

  queryAvailabilityGetForPlaceSport = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["availability", "getForPlaceSport"],
      (clientApi) => clientApi.availability.getForPlaceSport.query,
      input,
      this.toAppError,
    );

  queryAvailabilityGetForPlaceSportRange = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["availability", "getForPlaceSportRange"],
      (clientApi) => clientApi.availability.getForPlaceSportRange.query,
      input,
      this.toAppError,
    );

  queryCourtGetById = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["court", "getById"],
      (clientApi) => clientApi.court.getById.query,
      input,
      this.toAppError,
    );

  queryOrganizationMy = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["organization", "my"],
      (clientApi) => clientApi.organization.my.query,
      input,
      this.toAppError,
    );

  queryPlaceGetByIdOrSlug = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["place", "getByIdOrSlug"],
      (clientApi) => clientApi.place.getByIdOrSlug.query,
      input,
      this.toAppError,
    );

  queryPlaceList = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["place", "list"],
      (clientApi) => clientApi.place.list.query,
      input,
      this.toAppError,
    );

  queryPlaceListSummary = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["place", "listSummary"],
      (clientApi) => clientApi.place.listSummary.query,
      input,
      this.toAppError,
    );

  querySportList = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["sport", "list"],
      (clientApi) => clientApi.sport.list.query,
      input,
      this.toAppError,
    );

  queryPlaceCardMediaByIds = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["place", "cardMediaByIds"],
      (clientApi) => clientApi.place.cardMediaByIds.query,
      input,
      this.toAppError,
    );

  queryPlaceCardMetaByIds = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["place", "cardMetaByIds"],
      (clientApi) => clientApi.place.cardMetaByIds.query,
      input,
      this.toAppError,
    );
}

export const createDiscoveryApi = (deps: DiscoveryApiDeps = {}) =>
  new DiscoveryApi(deps);

const DISCOVERY_API_SINGLETON = createDiscoveryApi();

export const getDiscoveryApi = () => DISCOVERY_API_SINGLETON;
