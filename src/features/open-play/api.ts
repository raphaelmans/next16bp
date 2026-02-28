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
  mutOpenPlayCancelExternal: ProcedureFn<
    TrpcClientApi["openPlay"]["cancelExternal"]["mutate"]
  >;
  mutOpenPlayChatSendMessage: ProcedureFn<
    TrpcClientApi["openPlayChat"]["sendMessage"]["mutate"]
  >;
  mutOpenPlayClose: ProcedureFn<TrpcClientApi["openPlay"]["close"]["mutate"]>;
  mutOpenPlayCloseExternal: ProcedureFn<
    TrpcClientApi["openPlay"]["closeExternal"]["mutate"]
  >;
  mutOpenPlayCreateExternal: ProcedureFn<
    TrpcClientApi["openPlay"]["createExternal"]["mutate"]
  >;
  mutOpenPlayCreateFromReservation: ProcedureFn<
    TrpcClientApi["openPlay"]["createFromReservation"]["mutate"]
  >;
  mutOpenPlayCreateFromReservationGroup: ProcedureFn<
    TrpcClientApi["openPlay"]["createFromReservationGroup"]["mutate"]
  >;
  mutOpenPlayDecideExternalParticipant: ProcedureFn<
    TrpcClientApi["openPlay"]["decideExternalParticipant"]["mutate"]
  >;
  mutOpenPlayDecideParticipant: ProcedureFn<
    TrpcClientApi["openPlay"]["decideParticipant"]["mutate"]
  >;
  mutOpenPlayLeaveExternal: ProcedureFn<
    TrpcClientApi["openPlay"]["leaveExternal"]["mutate"]
  >;
  mutOpenPlayLeave: ProcedureFn<TrpcClientApi["openPlay"]["leave"]["mutate"]>;
  mutOpenPlayPromoteExternalToVerified: ProcedureFn<
    TrpcClientApi["openPlay"]["promoteExternalToVerified"]["mutate"]
  >;
  mutOpenPlayReportExternal: ProcedureFn<
    TrpcClientApi["openPlay"]["reportExternal"]["mutate"]
  >;
  mutOpenPlayRequestToJoinExternal: ProcedureFn<
    TrpcClientApi["openPlay"]["requestToJoinExternal"]["mutate"]
  >;
  mutOpenPlayRequestToJoin: ProcedureFn<
    TrpcClientApi["openPlay"]["requestToJoin"]["mutate"]
  >;
  queryOpenPlayChatGetSession: ProcedureFn<
    TrpcClientApi["openPlayChat"]["getSession"]["query"]
  >;
  queryOpenPlayGetDetail: ProcedureFn<
    TrpcClientApi["openPlay"]["getDetail"]["query"]
  >;
  queryOpenPlayGetExternalDetail: ProcedureFn<
    TrpcClientApi["openPlay"]["getExternalDetail"]["query"]
  >;
  queryOpenPlayGetExternalPublicDetail: ProcedureFn<
    TrpcClientApi["openPlay"]["getExternalPublicDetail"]["query"]
  >;
  queryOpenPlayGetForReservation: ProcedureFn<
    TrpcClientApi["openPlay"]["getForReservation"]["query"]
  >;
  queryOpenPlayGetForReservationGroup: ProcedureFn<
    TrpcClientApi["openPlay"]["getForReservationGroup"]["query"]
  >;
  queryOpenPlayGetPublicDetail: ProcedureFn<
    TrpcClientApi["openPlay"]["getPublicDetail"]["query"]
  >;
  queryOpenPlayListByPlace: ProcedureFn<
    TrpcClientApi["openPlay"]["listByPlace"]["query"]
  >;
  queryOpenPlayListExternalByPlace: ProcedureFn<
    TrpcClientApi["openPlay"]["listExternalByPlace"]["query"]
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

  mutOpenPlayCancelExternal: ProcedureFn<
    TrpcClientApi["openPlay"]["cancelExternal"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["openPlay", "cancelExternal"],
      (clientApi) => clientApi.openPlay.cancelExternal.mutate,
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

  mutOpenPlayCloseExternal: ProcedureFn<
    TrpcClientApi["openPlay"]["closeExternal"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["openPlay", "closeExternal"],
      (clientApi) => clientApi.openPlay.closeExternal.mutate,
      input,
      this.toAppError,
    );

  mutOpenPlayCreateExternal: ProcedureFn<
    TrpcClientApi["openPlay"]["createExternal"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["openPlay", "createExternal"],
      (clientApi) => clientApi.openPlay.createExternal.mutate,
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

  mutOpenPlayCreateFromReservationGroup: ProcedureFn<
    TrpcClientApi["openPlay"]["createFromReservationGroup"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["openPlay", "createFromReservationGroup"],
      (clientApi) => clientApi.openPlay.createFromReservationGroup.mutate,
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

  mutOpenPlayDecideExternalParticipant: ProcedureFn<
    TrpcClientApi["openPlay"]["decideExternalParticipant"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["openPlay", "decideExternalParticipant"],
      (clientApi) => clientApi.openPlay.decideExternalParticipant.mutate,
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

  mutOpenPlayLeaveExternal: ProcedureFn<
    TrpcClientApi["openPlay"]["leaveExternal"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["openPlay", "leaveExternal"],
      (clientApi) => clientApi.openPlay.leaveExternal.mutate,
      input,
      this.toAppError,
    );

  mutOpenPlayPromoteExternalToVerified: ProcedureFn<
    TrpcClientApi["openPlay"]["promoteExternalToVerified"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["openPlay", "promoteExternalToVerified"],
      (clientApi) => clientApi.openPlay.promoteExternalToVerified.mutate,
      input,
      this.toAppError,
    );

  mutOpenPlayReportExternal: ProcedureFn<
    TrpcClientApi["openPlay"]["reportExternal"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["openPlay", "reportExternal"],
      (clientApi) => clientApi.openPlay.reportExternal.mutate,
      input,
      this.toAppError,
    );

  mutOpenPlayRequestToJoinExternal: ProcedureFn<
    TrpcClientApi["openPlay"]["requestToJoinExternal"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["openPlay", "requestToJoinExternal"],
      (clientApi) => clientApi.openPlay.requestToJoinExternal.mutate,
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

  queryOpenPlayGetExternalDetail: ProcedureFn<
    TrpcClientApi["openPlay"]["getExternalDetail"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["openPlay", "getExternalDetail"],
      (clientApi) => clientApi.openPlay.getExternalDetail.query,
      input,
      this.toAppError,
    );

  queryOpenPlayGetExternalPublicDetail: ProcedureFn<
    TrpcClientApi["openPlay"]["getExternalPublicDetail"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["openPlay", "getExternalPublicDetail"],
      (clientApi) => clientApi.openPlay.getExternalPublicDetail.query,
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

  queryOpenPlayGetForReservationGroup: ProcedureFn<
    TrpcClientApi["openPlay"]["getForReservationGroup"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["openPlay", "getForReservationGroup"],
      (clientApi) => clientApi.openPlay.getForReservationGroup.query,
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

  queryOpenPlayListExternalByPlace: ProcedureFn<
    TrpcClientApi["openPlay"]["listExternalByPlace"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["openPlay", "listExternalByPlace"],
      (clientApi) => clientApi.openPlay.listExternalByPlace.query,
      input,
      this.toAppError,
    );
}

export const createOpenPlayApi = (deps: OpenPlayApiDeps = {}) =>
  new OpenPlayApi(deps);

const OPEN_PLAY_API_SINGLETON = createOpenPlayApi();

export const getOpenPlayApi = () => OPEN_PLAY_API_SINGLETON;
