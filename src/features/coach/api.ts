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

export interface ICoachApi {
  queryCoachGetSetupStatus: ProcedureFn<
    TrpcClientApi["coach"]["getSetupStatus"]["query"]
  >;
  queryCoachPaymentListMethods: ProcedureFn<
    TrpcClientApi["coachPayment"]["listMethods"]["query"]
  >;
  queryCoachHoursGet: ProcedureFn<TrpcClientApi["coachHours"]["get"]["query"]>;
  mutCoachPaymentCreateMethod: ProcedureFn<
    TrpcClientApi["coachPayment"]["createMethod"]["mutate"]
  >;
  mutCoachPaymentDeleteMethod: ProcedureFn<
    TrpcClientApi["coachPayment"]["deleteMethod"]["mutate"]
  >;
  mutCoachPaymentSetDefault: ProcedureFn<
    TrpcClientApi["coachPayment"]["setDefault"]["mutate"]
  >;
  mutCoachPaymentUpdateMethod: ProcedureFn<
    TrpcClientApi["coachPayment"]["updateMethod"]["mutate"]
  >;
  mutCoachHoursSet: ProcedureFn<TrpcClientApi["coachHours"]["set"]["mutate"]>;
  queryCoachBlockList: ProcedureFn<
    TrpcClientApi["coachBlock"]["list"]["query"]
  >;
  mutCoachBlockCreate: ProcedureFn<
    TrpcClientApi["coachBlock"]["create"]["mutate"]
  >;
  mutCoachBlockDelete: ProcedureFn<
    TrpcClientApi["coachBlock"]["delete"]["mutate"]
  >;
  queryCoachRateRuleGet: ProcedureFn<
    TrpcClientApi["coachRateRule"]["get"]["query"]
  >;
  mutCoachRateRuleSet: ProcedureFn<
    TrpcClientApi["coachRateRule"]["set"]["mutate"]
  >;
  queryCoachAddonGet: ProcedureFn<TrpcClientApi["coachAddon"]["get"]["query"]>;
  mutCoachAddonSet: ProcedureFn<TrpcClientApi["coachAddon"]["set"]["mutate"]>;
  queryReservationCoachGetForCoach: ProcedureFn<
    TrpcClientApi["reservationCoach"]["getForCoach"]["query"]
  >;
  queryReservationCoachGetDetail: ProcedureFn<
    TrpcClientApi["reservationCoach"]["getDetail"]["query"]
  >;
  queryReservationCoachGetPendingCount: ProcedureFn<
    TrpcClientApi["reservationCoach"]["getPendingCount"]["query"]
  >;
  mutReservationCoachAccept: ProcedureFn<
    TrpcClientApi["reservationCoach"]["accept"]["mutate"]
  >;
  mutReservationCoachReject: ProcedureFn<
    TrpcClientApi["reservationCoach"]["reject"]["mutate"]
  >;
  mutReservationCoachConfirmPayment: ProcedureFn<
    TrpcClientApi["reservationCoach"]["confirmPayment"]["mutate"]
  >;
  mutReservationCoachCancel: ProcedureFn<
    TrpcClientApi["reservationCoach"]["cancel"]["mutate"]
  >;
}

export type CoachApiDeps = {
  clientApi?: TrpcClientApi;
  toAppError?: (err: unknown) => AppError;
};

export class CoachApi implements ICoachApi {
  readonly clientApi: TrpcClientApi;
  private readonly toAppError: (err: unknown) => AppError;

  constructor(deps: CoachApiDeps = {}) {
    this.clientApi = deps.clientApi ?? getClientApi();
    this.toAppError = deps.toAppError ?? defaultToAppError;
  }

  queryCoachGetSetupStatus: ProcedureFn<
    TrpcClientApi["coach"]["getSetupStatus"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["coach", "getSetupStatus"],
      (clientApi) => clientApi.coach.getSetupStatus.query,
      input,
      this.toAppError,
    );

  queryCoachPaymentListMethods: ProcedureFn<
    TrpcClientApi["coachPayment"]["listMethods"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["coachPayment", "listMethods"],
      (clientApi) => clientApi.coachPayment.listMethods.query,
      input,
      this.toAppError,
    );

  queryCoachHoursGet: ProcedureFn<TrpcClientApi["coachHours"]["get"]["query"]> =
    async (input) =>
      callTrpcQuery(
        this.clientApi,
        ["coachHours", "get"],
        (clientApi) => clientApi.coachHours.get.query,
        input,
        this.toAppError,
      );

  mutCoachHoursSet: ProcedureFn<TrpcClientApi["coachHours"]["set"]["mutate"]> =
    async (input) =>
      callTrpcMutation(
        this.clientApi,
        ["coachHours", "set"],
        (clientApi) => clientApi.coachHours.set.mutate,
        input,
        this.toAppError,
      );

  mutCoachPaymentCreateMethod: ProcedureFn<
    TrpcClientApi["coachPayment"]["createMethod"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["coachPayment", "createMethod"],
      (clientApi) => clientApi.coachPayment.createMethod.mutate,
      input,
      this.toAppError,
    );

  mutCoachPaymentDeleteMethod: ProcedureFn<
    TrpcClientApi["coachPayment"]["deleteMethod"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["coachPayment", "deleteMethod"],
      (clientApi) => clientApi.coachPayment.deleteMethod.mutate,
      input,
      this.toAppError,
    );

  mutCoachPaymentSetDefault: ProcedureFn<
    TrpcClientApi["coachPayment"]["setDefault"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["coachPayment", "setDefault"],
      (clientApi) => clientApi.coachPayment.setDefault.mutate,
      input,
      this.toAppError,
    );

  mutCoachPaymentUpdateMethod: ProcedureFn<
    TrpcClientApi["coachPayment"]["updateMethod"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["coachPayment", "updateMethod"],
      (clientApi) => clientApi.coachPayment.updateMethod.mutate,
      input,
      this.toAppError,
    );

  queryCoachBlockList: ProcedureFn<
    TrpcClientApi["coachBlock"]["list"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["coachBlock", "list"],
      (clientApi) => clientApi.coachBlock.list.query,
      input,
      this.toAppError,
    );

  mutCoachBlockCreate: ProcedureFn<
    TrpcClientApi["coachBlock"]["create"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["coachBlock", "create"],
      (clientApi) => clientApi.coachBlock.create.mutate,
      input,
      this.toAppError,
    );

  mutCoachBlockDelete: ProcedureFn<
    TrpcClientApi["coachBlock"]["delete"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["coachBlock", "delete"],
      (clientApi) => clientApi.coachBlock.delete.mutate,
      input,
      this.toAppError,
    );

  queryCoachRateRuleGet: ProcedureFn<
    TrpcClientApi["coachRateRule"]["get"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["coachRateRule", "get"],
      (clientApi) => clientApi.coachRateRule.get.query,
      input,
      this.toAppError,
    );

  mutCoachRateRuleSet: ProcedureFn<
    TrpcClientApi["coachRateRule"]["set"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["coachRateRule", "set"],
      (clientApi) => clientApi.coachRateRule.set.mutate,
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

  mutCoachAddonSet: ProcedureFn<TrpcClientApi["coachAddon"]["set"]["mutate"]> =
    async (input) =>
      callTrpcMutation(
        this.clientApi,
        ["coachAddon", "set"],
        (clientApi) => clientApi.coachAddon.set.mutate,
        input,
        this.toAppError,
      );

  queryReservationCoachGetForCoach: ProcedureFn<
    TrpcClientApi["reservationCoach"]["getForCoach"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["reservationCoach", "getForCoach"],
      (clientApi) => clientApi.reservationCoach.getForCoach.query,
      input,
      this.toAppError,
    );

  queryReservationCoachGetDetail: ProcedureFn<
    TrpcClientApi["reservationCoach"]["getDetail"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["reservationCoach", "getDetail"],
      (clientApi) => clientApi.reservationCoach.getDetail.query,
      input,
      this.toAppError,
    );

  queryReservationCoachGetPendingCount: ProcedureFn<
    TrpcClientApi["reservationCoach"]["getPendingCount"]["query"]
  > = async () =>
    callTrpcQuery(
      this.clientApi,
      ["reservationCoach", "getPendingCount"],
      (clientApi) => clientApi.reservationCoach.getPendingCount.query,
      undefined,
      this.toAppError,
    );

  mutReservationCoachAccept: ProcedureFn<
    TrpcClientApi["reservationCoach"]["accept"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["reservationCoach", "accept"],
      (clientApi) => clientApi.reservationCoach.accept.mutate,
      input,
      this.toAppError,
    );

  mutReservationCoachReject: ProcedureFn<
    TrpcClientApi["reservationCoach"]["reject"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["reservationCoach", "reject"],
      (clientApi) => clientApi.reservationCoach.reject.mutate,
      input,
      this.toAppError,
    );

  mutReservationCoachConfirmPayment: ProcedureFn<
    TrpcClientApi["reservationCoach"]["confirmPayment"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["reservationCoach", "confirmPayment"],
      (clientApi) => clientApi.reservationCoach.confirmPayment.mutate,
      input,
      this.toAppError,
    );

  mutReservationCoachCancel: ProcedureFn<
    TrpcClientApi["reservationCoach"]["cancel"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["reservationCoach", "cancel"],
      (clientApi) => clientApi.reservationCoach.cancel.mutate,
      input,
      this.toAppError,
    );
}

export const createCoachApi = (deps: CoachApiDeps = {}) => new CoachApi(deps);

const COACH_API_SINGLETON = createCoachApi();

export const getCoachApi = () => COACH_API_SINGLETON;
