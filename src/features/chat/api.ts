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

export interface IChatApi {
  queryChatGetAuth: ProcedureFn<TrpcClientApi["chat"]["getAuth"]["query"]>;
  queryChatPocGetAuth: ProcedureFn<
    TrpcClientApi["chatPoc"]["getAuth"]["query"]
  >;
  mutChatPocGetOrCreateDm: ProcedureFn<
    TrpcClientApi["chatPoc"]["getOrCreateDm"]["mutate"]
  >;
  queryReservationChatGetSession: ProcedureFn<
    TrpcClientApi["reservationChat"]["getSession"]["query"]
  >;
  queryReservationChatGetGroupSession: ProcedureFn<
    TrpcClientApi["reservationChat"]["getGroupSession"]["query"]
  >;
  mutReservationChatSendMessage: ProcedureFn<
    TrpcClientApi["reservationChat"]["sendMessage"]["mutate"]
  >;
  mutReservationChatSendGroupMessage: ProcedureFn<
    TrpcClientApi["reservationChat"]["sendGroupMessage"]["mutate"]
  >;
  queryReservationChatGetThreadMetas: ProcedureFn<
    TrpcClientApi["reservationChat"]["getThreadMetas"]["query"]
  >;
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
  mutChatInboxArchiveThread: ProcedureFn<
    TrpcClientApi["chatInbox"]["archiveThread"]["mutate"]
  >;
  mutChatInboxUnarchiveThread: ProcedureFn<
    TrpcClientApi["chatInbox"]["unarchiveThread"]["mutate"]
  >;
  queryChatInboxListArchivedThreadIds: ProcedureFn<
    TrpcClientApi["chatInbox"]["listArchivedThreadIds"]["query"]
  >;
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

  queryChatGetAuth: ProcedureFn<TrpcClientApi["chat"]["getAuth"]["query"]> =
    async (input) =>
      callTrpcQuery(
        this.clientApi,
        ["chat", "getAuth"],
        (clientApi) => clientApi.chat.getAuth.query,
        input,
        this.toAppError,
      );

  queryChatPocGetAuth: ProcedureFn<
    TrpcClientApi["chatPoc"]["getAuth"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["chatPoc", "getAuth"],
      (clientApi) => clientApi.chatPoc.getAuth.query,
      input,
      this.toAppError,
    );

  mutChatPocGetOrCreateDm: ProcedureFn<
    TrpcClientApi["chatPoc"]["getOrCreateDm"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["chatPoc", "getOrCreateDm"],
      (clientApi) => clientApi.chatPoc.getOrCreateDm.mutate,
      input,
      this.toAppError,
    );

  queryReservationChatGetSession: ProcedureFn<
    TrpcClientApi["reservationChat"]["getSession"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["reservationChat", "getSession"],
      (clientApi) => clientApi.reservationChat.getSession.query,
      input,
      this.toAppError,
    );

  queryReservationChatGetGroupSession: ProcedureFn<
    TrpcClientApi["reservationChat"]["getGroupSession"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["reservationChat", "getGroupSession"],
      (clientApi) => clientApi.reservationChat.getGroupSession.query,
      input,
      this.toAppError,
    );

  mutReservationChatSendMessage: ProcedureFn<
    TrpcClientApi["reservationChat"]["sendMessage"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["reservationChat", "sendMessage"],
      (clientApi) => clientApi.reservationChat.sendMessage.mutate,
      input,
      this.toAppError,
    );

  mutReservationChatSendGroupMessage: ProcedureFn<
    TrpcClientApi["reservationChat"]["sendGroupMessage"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["reservationChat", "sendGroupMessage"],
      (clientApi) => clientApi.reservationChat.sendGroupMessage.mutate,
      input,
      this.toAppError,
    );

  queryReservationChatGetThreadMetas: ProcedureFn<
    TrpcClientApi["reservationChat"]["getThreadMetas"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["reservationChat", "getThreadMetas"],
      (clientApi) => clientApi.reservationChat.getThreadMetas.query,
      input,
      this.toAppError,
    );

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

  mutChatInboxArchiveThread: ProcedureFn<
    TrpcClientApi["chatInbox"]["archiveThread"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["chatInbox", "archiveThread"],
      (clientApi) => clientApi.chatInbox.archiveThread.mutate,
      input,
      this.toAppError,
    );

  mutChatInboxUnarchiveThread: ProcedureFn<
    TrpcClientApi["chatInbox"]["unarchiveThread"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["chatInbox", "unarchiveThread"],
      (clientApi) => clientApi.chatInbox.unarchiveThread.mutate,
      input,
      this.toAppError,
    );

  queryChatInboxListArchivedThreadIds: ProcedureFn<
    TrpcClientApi["chatInbox"]["listArchivedThreadIds"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["chatInbox", "listArchivedThreadIds"],
      (clientApi) => clientApi.chatInbox.listArchivedThreadIds.query,
      input,
      this.toAppError,
    );
}

export const createChatApi = (deps: ChatApiDeps = {}) => new ChatApi(deps);

const CHAT_API_SINGLETON = createChatApi();

export const getChatApi = () => CHAT_API_SINGLETON;
