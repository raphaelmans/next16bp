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

export interface ICoachDiscoveryApi {
  queryCoachGetByIdOrSlug: ProcedureFn<
    TrpcClientApi["coach"]["getByIdOrSlug"]["query"]
  >;
  queryCoachAvailabilityGetForCoach: ProcedureFn<
    TrpcClientApi["coachAvailability"]["getForCoach"]["query"]
  >;
  queryCoachAddonGet: ProcedureFn<TrpcClientApi["coachAddon"]["get"]["query"]>;
  mutReservationCreateForCoach: ProcedureFn<
    TrpcClientApi["reservation"]["createForCoach"]["mutate"]
  >;
}

export type CoachDiscoveryApiDeps = {
  clientApi?: TrpcClientApi;
  toAppError?: (err: unknown) => AppError;
};

export class CoachDiscoveryApi implements ICoachDiscoveryApi {
  readonly clientApi: TrpcClientApi;
  private readonly toAppError: (err: unknown) => AppError;

  constructor(deps: CoachDiscoveryApiDeps = {}) {
    this.clientApi = deps.clientApi ?? getClientApi();
    this.toAppError = deps.toAppError ?? defaultToAppError;
  }

  queryCoachGetByIdOrSlug: ProcedureFn<
    TrpcClientApi["coach"]["getByIdOrSlug"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["coach", "getByIdOrSlug"],
      (clientApi) => clientApi.coach.getByIdOrSlug.query,
      input,
      this.toAppError,
    );

  queryCoachAvailabilityGetForCoach: ProcedureFn<
    TrpcClientApi["coachAvailability"]["getForCoach"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["coachAvailability", "getForCoach"],
      (clientApi) => clientApi.coachAvailability.getForCoach.query,
      input,
      this.toAppError,
    );

  queryCoachAddonGet: ProcedureFn<TrpcClientApi["coachAddon"]["get"]["query"]> =
    async (input) =>
      callTrpcQuery(
        this.clientApi,
        ["coachAddon", "get"],
        (clientApi) => clientApi.coachAddon.get.query,
        input,
        this.toAppError,
      );

  mutReservationCreateForCoach: ProcedureFn<
    TrpcClientApi["reservation"]["createForCoach"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["reservation", "createForCoach"],
      (clientApi) => clientApi.reservation.createForCoach.mutate,
      input,
      this.toAppError,
    );
}

export const createCoachDiscoveryApi = (deps: CoachDiscoveryApiDeps = {}) =>
  new CoachDiscoveryApi(deps);

const COACH_DISCOVERY_API_SINGLETON = createCoachDiscoveryApi();

export const getCoachDiscoveryApi = () => COACH_DISCOVERY_API_SINGLETON;
