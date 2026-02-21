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

export interface IReservationApi {
  mutPaymentProofAdd: ProcedureFn<
    TrpcClientApi["paymentProof"]["add"]["mutate"]
  >;
  mutPaymentProofUpload: ProcedureFn<
    TrpcClientApi["paymentProof"]["upload"]["mutate"]
  >;
  mutProfileUpdate: ProcedureFn<TrpcClientApi["profile"]["update"]["mutate"]>;
  mutProfileUploadAvatar: ProcedureFn<
    TrpcClientApi["profile"]["uploadAvatar"]["mutate"]
  >;
  mutReservationCancel: ProcedureFn<
    TrpcClientApi["reservation"]["cancel"]["mutate"]
  >;
  mutReservationCreateForAnyCourt: ProcedureFn<
    TrpcClientApi["reservation"]["createForAnyCourt"]["mutate"]
  >;
  mutReservationCreateForCourt: ProcedureFn<
    TrpcClientApi["reservation"]["createForCourt"]["mutate"]
  >;
  mutReservationMarkPayment: ProcedureFn<
    TrpcClientApi["reservation"]["markPayment"]["mutate"]
  >;
  queryProfileMe: ProcedureFn<TrpcClientApi["profile"]["me"]["query"]>;
  queryReservationGetById: ProcedureFn<
    TrpcClientApi["reservation"]["getById"]["query"]
  >;
  queryReservationGetDetail: ProcedureFn<
    TrpcClientApi["reservation"]["getDetail"]["query"]
  >;
  queryReservationGetMyWithDetails: ProcedureFn<
    TrpcClientApi["reservation"]["getMyWithDetails"]["query"]
  >;
  queryReservationGetPaymentInfo: ProcedureFn<
    TrpcClientApi["reservation"]["getPaymentInfo"]["query"]
  >;
}

export type ReservationApiDeps = {
  clientApi?: TrpcClientApi;
  toAppError?: (err: unknown) => AppError;
};

export class ReservationApi {
  readonly clientApi: TrpcClientApi;
  private readonly toAppError: (err: unknown) => AppError;

  constructor(deps: ReservationApiDeps = {}) {
    this.clientApi = deps.clientApi ?? getClientApi();
    this.toAppError = deps.toAppError ?? defaultToAppError;
  }

  mutPaymentProofAdd: ProcedureFn<
    TrpcClientApi["paymentProof"]["add"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["paymentProof", "add"],
      (clientApi) => clientApi.paymentProof.add.mutate,
      input,
      this.toAppError,
    );

  mutPaymentProofUpload: ProcedureFn<
    TrpcClientApi["paymentProof"]["upload"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["paymentProof", "upload"],
      (clientApi) => clientApi.paymentProof.upload.mutate,
      input,
      this.toAppError,
    );

  mutProfileUpdate: ProcedureFn<TrpcClientApi["profile"]["update"]["mutate"]> =
    async (input) =>
      callTrpcMutation(
        this.clientApi,
        ["profile", "update"],
        (clientApi) => clientApi.profile.update.mutate,
        input,
        this.toAppError,
      );

  mutProfileUploadAvatar: ProcedureFn<
    TrpcClientApi["profile"]["uploadAvatar"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["profile", "uploadAvatar"],
      (clientApi) => clientApi.profile.uploadAvatar.mutate,
      input,
      this.toAppError,
    );

  mutReservationCancel: ProcedureFn<
    TrpcClientApi["reservation"]["cancel"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["reservation", "cancel"],
      (clientApi) => clientApi.reservation.cancel.mutate,
      input,
      this.toAppError,
    );

  mutReservationCreateForAnyCourt: ProcedureFn<
    TrpcClientApi["reservation"]["createForAnyCourt"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["reservation", "createForAnyCourt"],
      (clientApi) => clientApi.reservation.createForAnyCourt.mutate,
      input,
      this.toAppError,
    );

  mutReservationCreateForCourt: ProcedureFn<
    TrpcClientApi["reservation"]["createForCourt"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["reservation", "createForCourt"],
      (clientApi) => clientApi.reservation.createForCourt.mutate,
      input,
      this.toAppError,
    );

  mutReservationMarkPayment: ProcedureFn<
    TrpcClientApi["reservation"]["markPayment"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["reservation", "markPayment"],
      (clientApi) => clientApi.reservation.markPayment.mutate,
      input,
      this.toAppError,
    );

  queryProfileMe: ProcedureFn<TrpcClientApi["profile"]["me"]["query"]> = async (
    input,
  ) =>
    callTrpcQuery(
      this.clientApi,
      ["profile", "me"],
      (clientApi) => clientApi.profile.me.query,
      input,
      this.toAppError,
    );

  queryReservationGetById: ProcedureFn<
    TrpcClientApi["reservation"]["getById"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["reservation", "getById"],
      (clientApi) => clientApi.reservation.getById.query,
      input,
      this.toAppError,
    );

  queryReservationGetDetail: ProcedureFn<
    TrpcClientApi["reservation"]["getDetail"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["reservation", "getDetail"],
      (clientApi) => clientApi.reservation.getDetail.query,
      input,
      this.toAppError,
    );

  queryReservationGetMyWithDetails: ProcedureFn<
    TrpcClientApi["reservation"]["getMyWithDetails"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["reservation", "getMyWithDetails"],
      (clientApi) => clientApi.reservation.getMyWithDetails.query,
      input,
      this.toAppError,
    );

  queryReservationGetPaymentInfo: ProcedureFn<
    TrpcClientApi["reservation"]["getPaymentInfo"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["reservation", "getPaymentInfo"],
      (clientApi) => clientApi.reservation.getPaymentInfo.query,
      input,
      this.toAppError,
    );
}

export const createReservationApi = (deps: ReservationApiDeps = {}) =>
  new ReservationApi(deps);

const RESERVATION_API_SINGLETON = createReservationApi();

export const getReservationApi = () => RESERVATION_API_SINGLETON;
