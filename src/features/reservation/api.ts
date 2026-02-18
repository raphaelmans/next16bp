"use client";

import type { AppError } from "@/common/errors/app-error";
import { toAppError as defaultToAppError } from "@/common/errors/to-app-error";
import { callTrpcMutation, callTrpcQuery } from "@/common/trpc-client-call";
import { getClientApi, type TrpcClientApi } from "@/trpc/client-api";

export interface IReservationApi {
  mutPaymentProofAdd: (input?: unknown) => Promise<unknown>;
  mutPaymentProofUpload: (input?: unknown) => Promise<unknown>;
  mutProfileUpdate: (input?: unknown) => Promise<unknown>;
  mutProfileUploadAvatar: (input?: unknown) => Promise<unknown>;
  mutReservationCancel: (input?: unknown) => Promise<unknown>;
  mutReservationCreateForAnyCourt: (input?: unknown) => Promise<unknown>;
  mutReservationCreateForCourt: (input?: unknown) => Promise<unknown>;
  mutReservationMarkPayment: (input?: unknown) => Promise<unknown>;
  queryProfileMe: (input?: unknown) => Promise<unknown>;
  queryReservationGetById: (input?: unknown) => Promise<unknown>;
  queryReservationGetDetail: (input?: unknown) => Promise<unknown>;
  queryReservationGetMyWithDetails: (input?: unknown) => Promise<unknown>;
  queryReservationGetPaymentInfo: (input?: unknown) => Promise<unknown>;
}

export type ReservationApiDeps = {
  clientApi?: TrpcClientApi;
  toAppError?: (err: unknown) => AppError;
};

export class ReservationApi implements IReservationApi {
  readonly clientApi: TrpcClientApi;
  private readonly toAppError: (err: unknown) => AppError;

  constructor(deps: ReservationApiDeps = {}) {
    this.clientApi = deps.clientApi ?? getClientApi();
    this.toAppError = deps.toAppError ?? defaultToAppError;
  }

  mutPaymentProofAdd = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["paymentProof", "add"],
      input,
      this.toAppError,
    );

  mutPaymentProofUpload = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["paymentProof", "upload"],
      input,
      this.toAppError,
    );

  mutProfileUpdate = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["profile", "update"],
      input,
      this.toAppError,
    );

  mutProfileUploadAvatar = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["profile", "uploadAvatar"],
      input,
      this.toAppError,
    );

  mutReservationCancel = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["reservation", "cancel"],
      input,
      this.toAppError,
    );

  mutReservationCreateForAnyCourt = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["reservation", "createForAnyCourt"],
      input,
      this.toAppError,
    );

  mutReservationCreateForCourt = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["reservation", "createForCourt"],
      input,
      this.toAppError,
    );

  mutReservationMarkPayment = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["reservation", "markPayment"],
      input,
      this.toAppError,
    );

  queryProfileMe = async (input?: unknown) =>
    callTrpcQuery(this.clientApi, ["profile", "me"], input, this.toAppError);

  queryReservationGetById = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["reservation", "getById"],
      input,
      this.toAppError,
    );

  queryReservationGetDetail = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["reservation", "getDetail"],
      input,
      this.toAppError,
    );

  queryReservationGetMyWithDetails = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["reservation", "getMyWithDetails"],
      input,
      this.toAppError,
    );

  queryReservationGetPaymentInfo = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["reservation", "getPaymentInfo"],
      input,
      this.toAppError,
    );
}

export const createReservationApi = (
  deps: ReservationApiDeps = {},
): IReservationApi => new ReservationApi(deps);

const RESERVATION_API_SINGLETON = createReservationApi();

export const getReservationApi = (): IReservationApi =>
  RESERVATION_API_SINGLETON;
