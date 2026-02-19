"use client";

import type { AppError } from "@/common/errors/app-error";
import { toAppError as defaultToAppError } from "@/common/errors/to-app-error";
import { callTrpcMutation, callTrpcQuery } from "@/common/trpc-client-call";
import { getClientApi, type TrpcClientApi } from "@/trpc/client-api";

export interface IChatApi {
  queryChatGetAuth: (input?: unknown) => Promise<unknown>;
  queryChatPocGetAuth: (input?: unknown) => Promise<unknown>;
  mutChatPocGetOrCreateDm: (input?: unknown) => Promise<unknown>;
  queryReservationChatGetSession: (input?: unknown) => Promise<unknown>;
  mutReservationChatSendMessage: (input?: unknown) => Promise<unknown>;
  queryReservationChatGetThreadMetas: (input?: unknown) => Promise<unknown>;
  mutSupportChatBackfillClaimThreads: (input?: unknown) => Promise<unknown>;
  mutSupportChatSendClaimMessage: (input?: unknown) => Promise<unknown>;
  mutSupportChatSendVerificationMessage: (input?: unknown) => Promise<unknown>;
  querySupportChatGetClaimSession: (input?: unknown) => Promise<unknown>;
  querySupportChatGetVerificationSession: (input?: unknown) => Promise<unknown>;
}

export type ChatApiDeps = {
  clientApi?: TrpcClientApi;
  toAppError?: (err: unknown) => AppError;
};

export class ChatApi {
  readonly clientApi: TrpcClientApi;
  private readonly toAppError: (err: unknown) => AppError;

  constructor(deps: ChatApiDeps = {}) {
    this.clientApi = deps.clientApi ?? getClientApi();
    this.toAppError = deps.toAppError ?? defaultToAppError;
  }

  queryChatGetAuth = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["chat", "getAuth"],
      (clientApi) => clientApi.chat.getAuth.query,
      input,
      this.toAppError,
    );

  queryChatPocGetAuth = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["chatPoc", "getAuth"],
      (clientApi) => clientApi.chatPoc.getAuth.query,
      input,
      this.toAppError,
    );

  mutChatPocGetOrCreateDm = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["chatPoc", "getOrCreateDm"],
      (clientApi) => clientApi.chatPoc.getOrCreateDm.mutate,
      input,
      this.toAppError,
    );

  queryReservationChatGetSession = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["reservationChat", "getSession"],
      (clientApi) => clientApi.reservationChat.getSession.query,
      input,
      this.toAppError,
    );

  mutReservationChatSendMessage = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["reservationChat", "sendMessage"],
      (clientApi) => clientApi.reservationChat.sendMessage.mutate,
      input,
      this.toAppError,
    );

  queryReservationChatGetThreadMetas = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["reservationChat", "getThreadMetas"],
      (clientApi) => clientApi.reservationChat.getThreadMetas.query,
      input,
      this.toAppError,
    );

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

export const createChatApi = (deps: ChatApiDeps = {}) => new ChatApi(deps);

const CHAT_API_SINGLETON = createChatApi();

export const getChatApi = () => CHAT_API_SINGLETON;
