"use client";

import type { AppError } from "@/common/errors/app-error";
import { toAppError as defaultToAppError } from "@/common/errors/to-app-error";
import { callTrpcMutation, callTrpcQuery } from "@/common/trpc-client-call";
import { getClientApi, type TrpcClientApi } from "@/trpc/client-api";

export interface INotificationsApi {
  mutPushSubscriptionRevokeMySubscription: (
    input?: unknown,
  ) => Promise<unknown>;
  mutPushSubscriptionUpsertMySubscription: (
    input?: unknown,
  ) => Promise<unknown>;
  queryPushSubscriptionGetVapidPublicKey: (input?: unknown) => Promise<unknown>;
}

export type NotificationsApiDeps = {
  clientApi?: TrpcClientApi;
  toAppError?: (err: unknown) => AppError;
};

export class NotificationsApi implements INotificationsApi {
  readonly clientApi: TrpcClientApi;
  private readonly toAppError: (err: unknown) => AppError;

  constructor(deps: NotificationsApiDeps = {}) {
    this.clientApi = deps.clientApi ?? getClientApi();
    this.toAppError = deps.toAppError ?? defaultToAppError;
  }

  mutPushSubscriptionRevokeMySubscription = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["pushSubscription", "revokeMySubscription"],
      input,
      this.toAppError,
    );

  mutPushSubscriptionUpsertMySubscription = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["pushSubscription", "upsertMySubscription"],
      input,
      this.toAppError,
    );

  queryPushSubscriptionGetVapidPublicKey = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["pushSubscription", "getVapidPublicKey"],
      input,
      this.toAppError,
    );
}

export const createNotificationsApi = (
  deps: NotificationsApiDeps = {},
): INotificationsApi => new NotificationsApi(deps);

const NOTIFICATIONS_API_SINGLETON = createNotificationsApi();

export const getNotificationsApi = (): INotificationsApi =>
  NOTIFICATIONS_API_SINGLETON;
