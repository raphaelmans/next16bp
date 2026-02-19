"use client";

import type { AppError } from "@/common/errors/app-error";
import { toAppError as defaultToAppError } from "@/common/errors/to-app-error";
import { callTrpcMutation, callTrpcQuery } from "@/common/trpc-client-call";
import { getClientApi, type TrpcClientApi } from "@/trpc/client-api";

export interface ISupportChatApi {
  mutSupportChatBackfillClaimThreads: (input?: unknown) => Promise<unknown>;
  mutSupportChatSendClaimMessage: (input?: unknown) => Promise<unknown>;
  mutSupportChatSendVerificationMessage: (input?: unknown) => Promise<unknown>;
  querySupportChatGetClaimSession: (input?: unknown) => Promise<unknown>;
  querySupportChatGetVerificationSession: (input?: unknown) => Promise<unknown>;
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

  mutSupportChatBackfillClaimThreads = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["supportChat", "backfillClaimThreads"],
      (clientApi) => clientApi.supportChat.backfillClaimThreads.mutate,
      input,
      this.toAppError,
    );

  mutSupportChatSendClaimMessage = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["supportChat", "sendClaimMessage"],
      (clientApi) => clientApi.supportChat.sendClaimMessage.mutate,
      input,
      this.toAppError,
    );

  mutSupportChatSendVerificationMessage = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["supportChat", "sendVerificationMessage"],
      (clientApi) => clientApi.supportChat.sendVerificationMessage.mutate,
      input,
      this.toAppError,
    );

  querySupportChatGetClaimSession = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["supportChat", "getClaimSession"],
      (clientApi) => clientApi.supportChat.getClaimSession.query,
      input,
      this.toAppError,
    );

  querySupportChatGetVerificationSession = async (input?: unknown) =>
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
