"use client";

import type { AppError } from "@/common/errors/app-error";
import { toAppError as defaultToAppError } from "@/common/errors/to-app-error";
import { callTrpcMutation, callTrpcQuery } from "@/common/trpc-client-call";
import { getClientApi, type TrpcClientApi } from "@/trpc/client-api";

export interface IOpenPlayApi {
  mutOpenPlayCancel: (input?: unknown) => Promise<unknown>;
  mutOpenPlayChatSendMessage: (input?: unknown) => Promise<unknown>;
  mutOpenPlayClose: (input?: unknown) => Promise<unknown>;
  mutOpenPlayCreateFromReservation: (input?: unknown) => Promise<unknown>;
  mutOpenPlayDecideParticipant: (input?: unknown) => Promise<unknown>;
  mutOpenPlayLeave: (input?: unknown) => Promise<unknown>;
  mutOpenPlayRequestToJoin: (input?: unknown) => Promise<unknown>;
  queryOpenPlayChatGetSession: (input?: unknown) => Promise<unknown>;
  queryOpenPlayGetDetail: (input?: unknown) => Promise<unknown>;
  queryOpenPlayGetForReservation: (input?: unknown) => Promise<unknown>;
  queryOpenPlayGetPublicDetail: (input?: unknown) => Promise<unknown>;
  queryOpenPlayListByPlace: (input?: unknown) => Promise<unknown>;
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

  mutOpenPlayCancel = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["openPlay", "cancel"],
      (clientApi) => clientApi.openPlay.cancel.mutate,
      input,
      this.toAppError,
    );

  mutOpenPlayChatSendMessage = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["openPlayChat", "sendMessage"],
      (clientApi) => clientApi.openPlayChat.sendMessage.mutate,
      input,
      this.toAppError,
    );

  mutOpenPlayClose = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["openPlay", "close"],
      (clientApi) => clientApi.openPlay.close.mutate,
      input,
      this.toAppError,
    );

  mutOpenPlayCreateFromReservation = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["openPlay", "createFromReservation"],
      (clientApi) => clientApi.openPlay.createFromReservation.mutate,
      input,
      this.toAppError,
    );

  mutOpenPlayDecideParticipant = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["openPlay", "decideParticipant"],
      (clientApi) => clientApi.openPlay.decideParticipant.mutate,
      input,
      this.toAppError,
    );

  mutOpenPlayLeave = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["openPlay", "leave"],
      (clientApi) => clientApi.openPlay.leave.mutate,
      input,
      this.toAppError,
    );

  mutOpenPlayRequestToJoin = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["openPlay", "requestToJoin"],
      (clientApi) => clientApi.openPlay.requestToJoin.mutate,
      input,
      this.toAppError,
    );

  queryOpenPlayChatGetSession = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["openPlayChat", "getSession"],
      (clientApi) => clientApi.openPlayChat.getSession.query,
      input,
      this.toAppError,
    );

  queryOpenPlayGetDetail = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["openPlay", "getDetail"],
      (clientApi) => clientApi.openPlay.getDetail.query,
      input,
      this.toAppError,
    );

  queryOpenPlayGetForReservation = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["openPlay", "getForReservation"],
      (clientApi) => clientApi.openPlay.getForReservation.query,
      input,
      this.toAppError,
    );

  queryOpenPlayGetPublicDetail = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["openPlay", "getPublicDetail"],
      (clientApi) => clientApi.openPlay.getPublicDetail.query,
      input,
      this.toAppError,
    );

  queryOpenPlayListByPlace = async (input?: unknown) =>
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
