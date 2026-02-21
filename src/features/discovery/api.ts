"use client";

import type { AppError } from "@/common/errors/app-error";
import { toAppError as defaultToAppError } from "@/common/errors/to-app-error";
import { callTrpcMutation, callTrpcQuery } from "@/common/trpc-client-call";
import { getClientApi, type TrpcClientApi } from "@/trpc/client-api";

type ProcedureFn<TProcedure> = TProcedure extends (
  input: infer TInput,
  ...rest: infer _TRest
) => Promise<infer TResult>
  ? (input?: TInput) => Promise<TResult>
  : never;

export interface IDiscoveryApi {
  mutClaimRequestSubmitClaim: ProcedureFn<
    TrpcClientApi["claimRequest"]["submitClaim"]["mutate"]
  >;
  mutClaimRequestSubmitGuestRemoval: ProcedureFn<
    TrpcClientApi["claimRequest"]["submitGuestRemoval"]["mutate"]
  >;
  queryAvailabilityGetForCourt: ProcedureFn<
    TrpcClientApi["availability"]["getForCourt"]["query"]
  >;
  queryAvailabilityGetForCourtRange: ProcedureFn<
    TrpcClientApi["availability"]["getForCourtRange"]["query"]
  >;
  queryAvailabilityGetForPlaceSport: ProcedureFn<
    TrpcClientApi["availability"]["getForPlaceSport"]["query"]
  >;
  queryAvailabilityGetForPlaceSportRange: ProcedureFn<
    TrpcClientApi["availability"]["getForPlaceSportRange"]["query"]
  >;
  queryCourtGetById: ProcedureFn<TrpcClientApi["court"]["getById"]["query"]>;
  queryOrganizationMy: ProcedureFn<
    TrpcClientApi["organization"]["my"]["query"]
  >;
  queryPlaceGetByIdOrSlug: ProcedureFn<
    TrpcClientApi["place"]["getByIdOrSlug"]["query"]
  >;
  queryPlaceList: ProcedureFn<TrpcClientApi["place"]["list"]["query"]>;
  queryPlaceListSummary: ProcedureFn<
    TrpcClientApi["place"]["listSummary"]["query"]
  >;
  querySportList: ProcedureFn<TrpcClientApi["sport"]["list"]["query"]>;
  queryPlaceCardMediaByIds: ProcedureFn<
    TrpcClientApi["place"]["cardMediaByIds"]["query"]
  >;
  queryPlaceCardMetaByIds: ProcedureFn<
    TrpcClientApi["place"]["cardMetaByIds"]["query"]
  >;
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

  mutClaimRequestSubmitClaim: ProcedureFn<
    TrpcClientApi["claimRequest"]["submitClaim"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["claimRequest", "submitClaim"],
      (clientApi) => clientApi.claimRequest.submitClaim.mutate,
      input,
      this.toAppError,
    );

  mutClaimRequestSubmitGuestRemoval: ProcedureFn<
    TrpcClientApi["claimRequest"]["submitGuestRemoval"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["claimRequest", "submitGuestRemoval"],
      (clientApi) => clientApi.claimRequest.submitGuestRemoval.mutate,
      input,
      this.toAppError,
    );

  queryAvailabilityGetForCourt: ProcedureFn<
    TrpcClientApi["availability"]["getForCourt"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["availability", "getForCourt"],
      (clientApi) => clientApi.availability.getForCourt.query,
      input,
      this.toAppError,
    );

  queryAvailabilityGetForCourtRange: ProcedureFn<
    TrpcClientApi["availability"]["getForCourtRange"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["availability", "getForCourtRange"],
      (clientApi) => clientApi.availability.getForCourtRange.query,
      input,
      this.toAppError,
    );

  queryAvailabilityGetForPlaceSport: ProcedureFn<
    TrpcClientApi["availability"]["getForPlaceSport"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["availability", "getForPlaceSport"],
      (clientApi) => clientApi.availability.getForPlaceSport.query,
      input,
      this.toAppError,
    );

  queryAvailabilityGetForPlaceSportRange: ProcedureFn<
    TrpcClientApi["availability"]["getForPlaceSportRange"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["availability", "getForPlaceSportRange"],
      (clientApi) => clientApi.availability.getForPlaceSportRange.query,
      input,
      this.toAppError,
    );

  queryCourtGetById: ProcedureFn<TrpcClientApi["court"]["getById"]["query"]> =
    async (input) =>
      callTrpcQuery(
        this.clientApi,
        ["court", "getById"],
        (clientApi) => clientApi.court.getById.query,
        input,
        this.toAppError,
      );

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

  queryPlaceGetByIdOrSlug: ProcedureFn<
    TrpcClientApi["place"]["getByIdOrSlug"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["place", "getByIdOrSlug"],
      (clientApi) => clientApi.place.getByIdOrSlug.query,
      input,
      this.toAppError,
    );

  queryPlaceList: ProcedureFn<TrpcClientApi["place"]["list"]["query"]> = async (
    input,
  ) =>
    callTrpcQuery(
      this.clientApi,
      ["place", "list"],
      (clientApi) => clientApi.place.list.query,
      input,
      this.toAppError,
    );

  queryPlaceListSummary: ProcedureFn<
    TrpcClientApi["place"]["listSummary"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["place", "listSummary"],
      (clientApi) => clientApi.place.listSummary.query,
      input,
      this.toAppError,
    );

  querySportList: ProcedureFn<TrpcClientApi["sport"]["list"]["query"]> = async (
    input,
  ) =>
    callTrpcQuery(
      this.clientApi,
      ["sport", "list"],
      (clientApi) => clientApi.sport.list.query,
      input,
      this.toAppError,
    );

  queryPlaceCardMediaByIds: ProcedureFn<
    TrpcClientApi["place"]["cardMediaByIds"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["place", "cardMediaByIds"],
      (clientApi) => clientApi.place.cardMediaByIds.query,
      input,
      this.toAppError,
    );

  queryPlaceCardMetaByIds: ProcedureFn<
    TrpcClientApi["place"]["cardMetaByIds"]["query"]
  > = async (input) =>
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
