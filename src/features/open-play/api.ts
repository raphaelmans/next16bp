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

export interface IOpenPlayApi {
  mutOpenPlayCancel: ProcedureFn<TrpcClientApi["openPlay"]["cancel"]["mutate"]>;
  mutOpenPlayChatSendMessage: ProcedureFn<
    TrpcClientApi["openPlayChat"]["sendMessage"]["mutate"]
  >;
  mutOpenPlayClose: ProcedureFn<TrpcClientApi["openPlay"]["close"]["mutate"]>;
  mutOpenPlayCreateFromReservation: ProcedureFn<
    TrpcClientApi["openPlay"]["createFromReservation"]["mutate"]
  >;
  mutOpenPlayDecideParticipant: ProcedureFn<
    TrpcClientApi["openPlay"]["decideParticipant"]["mutate"]
  >;
  mutOpenPlayLeave: ProcedureFn<TrpcClientApi["openPlay"]["leave"]["mutate"]>;
  mutOpenPlayRequestToJoin: ProcedureFn<
    TrpcClientApi["openPlay"]["requestToJoin"]["mutate"]
  >;
  queryOpenPlayChatGetSession: ProcedureFn<
    TrpcClientApi["openPlayChat"]["getSession"]["query"]
  >;
  queryOpenPlayGetDetail: ProcedureFn<
    TrpcClientApi["openPlay"]["getDetail"]["query"]
  >;
  queryOpenPlayGetForReservation: ProcedureFn<
    TrpcClientApi["openPlay"]["getForReservation"]["query"]
  >;
  queryOpenPlayGetPublicDetail: ProcedureFn<
    TrpcClientApi["openPlay"]["getPublicDetail"]["query"]
  >;
  queryOpenPlayListByPlace: ProcedureFn<
    TrpcClientApi["openPlay"]["listByPlace"]["query"]
  >;
}

export type OpenPlayApiDeps = {
  clientApi?: TrpcClientApi;
  toAppError?: (err: unknown) => AppError;
};

export class OpenPlayApi {
  readonly clientApi: TrpcClientApi;
  private readonly toAppError: (err: unknown) => AppError;

  constructor(deps: OpenPlayApiDeps = {}) {
    this.clientApi = deps.clientApi ?? getClientApi();
    this.toAppError = deps.toAppError ?? defaultToAppError;
  }

  mutOpenPlayCancel: ProcedureFn<
    TrpcClientApi["openPlay"]["cancel"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["openPlay", "cancel"],
      (clientApi) => clientApi.openPlay.cancel.mutate,
      input,
      this.toAppError,
    );

  mutOpenPlayChatSendMessage: ProcedureFn<
    TrpcClientApi["openPlayChat"]["sendMessage"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["openPlayChat", "sendMessage"],
      (clientApi) => clientApi.openPlayChat.sendMessage.mutate,
      input,
      this.toAppError,
    );

  mutOpenPlayClose: ProcedureFn<TrpcClientApi["openPlay"]["close"]["mutate"]> =
    async (input) =>
      callTrpcMutation(
        this.clientApi,
        ["openPlay", "close"],
        (clientApi) => clientApi.openPlay.close.mutate,
        input,
        this.toAppError,
      );

  mutOpenPlayCreateFromReservation: ProcedureFn<
    TrpcClientApi["openPlay"]["createFromReservation"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["openPlay", "createFromReservation"],
      (clientApi) => clientApi.openPlay.createFromReservation.mutate,
      input,
      this.toAppError,
    );

  mutOpenPlayDecideParticipant: ProcedureFn<
    TrpcClientApi["openPlay"]["decideParticipant"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["openPlay", "decideParticipant"],
      (clientApi) => clientApi.openPlay.decideParticipant.mutate,
      input,
      this.toAppError,
    );

  mutOpenPlayLeave: ProcedureFn<TrpcClientApi["openPlay"]["leave"]["mutate"]> =
    async (input) =>
      callTrpcMutation(
        this.clientApi,
        ["openPlay", "leave"],
        (clientApi) => clientApi.openPlay.leave.mutate,
        input,
        this.toAppError,
      );

  mutOpenPlayRequestToJoin: ProcedureFn<
    TrpcClientApi["openPlay"]["requestToJoin"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["openPlay", "requestToJoin"],
      (clientApi) => clientApi.openPlay.requestToJoin.mutate,
      input,
      this.toAppError,
    );

  queryOpenPlayChatGetSession: ProcedureFn<
    TrpcClientApi["openPlayChat"]["getSession"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["openPlayChat", "getSession"],
      (clientApi) => clientApi.openPlayChat.getSession.query,
      input,
      this.toAppError,
    );

  queryOpenPlayGetDetail: ProcedureFn<
    TrpcClientApi["openPlay"]["getDetail"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["openPlay", "getDetail"],
      (clientApi) => clientApi.openPlay.getDetail.query,
      input,
      this.toAppError,
    );

  queryOpenPlayGetForReservation: ProcedureFn<
    TrpcClientApi["openPlay"]["getForReservation"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["openPlay", "getForReservation"],
      (clientApi) => clientApi.openPlay.getForReservation.query,
      input,
      this.toAppError,
    );

  queryOpenPlayGetPublicDetail: ProcedureFn<
    TrpcClientApi["openPlay"]["getPublicDetail"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["openPlay", "getPublicDetail"],
      (clientApi) => clientApi.openPlay.getPublicDetail.query,
      input,
      this.toAppError,
    );

  queryOpenPlayListByPlace: ProcedureFn<
    TrpcClientApi["openPlay"]["listByPlace"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["openPlay", "listByPlace"],
      (clientApi) => clientApi.openPlay.listByPlace.query,
      input,
      this.toAppError,
    );
}

export const createOpenPlayApi = (deps: OpenPlayApiDeps = {}) =>
  new OpenPlayApi(deps);

const OPEN_PLAY_API_SINGLETON = createOpenPlayApi();

export const getOpenPlayApi = () => OPEN_PLAY_API_SINGLETON;
