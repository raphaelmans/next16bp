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

export interface ISupportChatApi {
  mutSupportChatBackfillClaimThreads: ProcedureFn<
    TrpcClientApi["supportChat"]["backfillClaimThreads"]["mutate"]
  >;
  mutSupportChatSendClaimMessage: ProcedureFn<
    TrpcClientApi["supportChat"]["sendClaimMessage"]["mutate"]
  >;
  mutSupportChatSendVerificationMessage: ProcedureFn<
    TrpcClientApi["supportChat"]["sendVerificationMessage"]["mutate"]
  >;
  querySupportChatGetClaimSession: ProcedureFn<
    TrpcClientApi["supportChat"]["getClaimSession"]["query"]
  >;
  querySupportChatGetVerificationSession: ProcedureFn<
    TrpcClientApi["supportChat"]["getVerificationSession"]["query"]
  >;
}

export type SupportChatApiDeps = {
  clientApi?: TrpcClientApi;
  toAppError?: (err: unknown) => AppError;
};

export class SupportChatApi {
  readonly clientApi: TrpcClientApi;
  private readonly toAppError: (err: unknown) => AppError;

  constructor(deps: SupportChatApiDeps = {}) {
    this.clientApi = deps.clientApi ?? getClientApi();
    this.toAppError = deps.toAppError ?? defaultToAppError;
  }

  mutSupportChatBackfillClaimThreads: ProcedureFn<
    TrpcClientApi["supportChat"]["backfillClaimThreads"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["supportChat", "backfillClaimThreads"],
      (clientApi) => clientApi.supportChat.backfillClaimThreads.mutate,
      input,
      this.toAppError,
    );

  mutSupportChatSendClaimMessage: ProcedureFn<
    TrpcClientApi["supportChat"]["sendClaimMessage"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["supportChat", "sendClaimMessage"],
      (clientApi) => clientApi.supportChat.sendClaimMessage.mutate,
      input,
      this.toAppError,
    );

  mutSupportChatSendVerificationMessage: ProcedureFn<
    TrpcClientApi["supportChat"]["sendVerificationMessage"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["supportChat", "sendVerificationMessage"],
      (clientApi) => clientApi.supportChat.sendVerificationMessage.mutate,
      input,
      this.toAppError,
    );

  querySupportChatGetClaimSession: ProcedureFn<
    TrpcClientApi["supportChat"]["getClaimSession"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["supportChat", "getClaimSession"],
      (clientApi) => clientApi.supportChat.getClaimSession.query,
      input,
      this.toAppError,
    );

  querySupportChatGetVerificationSession: ProcedureFn<
    TrpcClientApi["supportChat"]["getVerificationSession"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["supportChat", "getVerificationSession"],
      (clientApi) => clientApi.supportChat.getVerificationSession.query,
      input,
      this.toAppError,
    );
}

export const createSupportChatApi = (deps: SupportChatApiDeps = {}) =>
  new SupportChatApi(deps);

const SUPPORT_CHAT_API_SINGLETON = createSupportChatApi();

export const getSupportChatApi = () => SUPPORT_CHAT_API_SINGLETON;
