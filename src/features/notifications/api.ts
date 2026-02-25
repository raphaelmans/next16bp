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

export interface INotificationsApi {
  mutUserNotificationMarkAllAsRead: ProcedureFn<
    TrpcClientApi["userNotification"]["markAllAsRead"]["mutate"]
  >;
  mutUserNotificationMarkAsRead: ProcedureFn<
    TrpcClientApi["userNotification"]["markAsRead"]["mutate"]
  >;
  mutPushSubscriptionRevokeMySubscription: ProcedureFn<
    TrpcClientApi["pushSubscription"]["revokeMySubscription"]["mutate"]
  >;
  mutPushSubscriptionSendTestPush: ProcedureFn<
    TrpcClientApi["pushSubscription"]["sendTestPush"]["mutate"]
  >;
  mutPushSubscriptionUpsertMySubscription: ProcedureFn<
    TrpcClientApi["pushSubscription"]["upsertMySubscription"]["mutate"]
  >;
  queryPushSubscriptionGetVapidPublicKey: ProcedureFn<
    TrpcClientApi["pushSubscription"]["getVapidPublicKey"]["query"]
  >;
  queryUserNotificationListMy: ProcedureFn<
    TrpcClientApi["userNotification"]["listMy"]["query"]
  >;
  queryUserNotificationUnreadCount: ProcedureFn<
    TrpcClientApi["userNotification"]["unreadCount"]["query"]
  >;
}

export type NotificationsApiDeps = {
  clientApi?: TrpcClientApi;
  toAppError?: (err: unknown) => AppError;
};

export class NotificationsApi {
  readonly clientApi: TrpcClientApi;
  private readonly toAppError: (err: unknown) => AppError;

  constructor(deps: NotificationsApiDeps = {}) {
    this.clientApi = deps.clientApi ?? getClientApi();
    this.toAppError = deps.toAppError ?? defaultToAppError;
  }

  mutPushSubscriptionRevokeMySubscription: ProcedureFn<
    TrpcClientApi["pushSubscription"]["revokeMySubscription"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["pushSubscription", "revokeMySubscription"],
      (clientApi) => clientApi.pushSubscription.revokeMySubscription.mutate,
      input,
      this.toAppError,
    );

  mutPushSubscriptionSendTestPush: ProcedureFn<
    TrpcClientApi["pushSubscription"]["sendTestPush"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["pushSubscription", "sendTestPush"],
      (clientApi) => clientApi.pushSubscription.sendTestPush.mutate,
      input,
      this.toAppError,
    );

  mutUserNotificationMarkAllAsRead: ProcedureFn<
    TrpcClientApi["userNotification"]["markAllAsRead"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["userNotification", "markAllAsRead"],
      (clientApi) => clientApi.userNotification.markAllAsRead.mutate,
      input,
      this.toAppError,
    );

  mutUserNotificationMarkAsRead: ProcedureFn<
    TrpcClientApi["userNotification"]["markAsRead"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["userNotification", "markAsRead"],
      (clientApi) => clientApi.userNotification.markAsRead.mutate,
      input,
      this.toAppError,
    );

  mutPushSubscriptionUpsertMySubscription: ProcedureFn<
    TrpcClientApi["pushSubscription"]["upsertMySubscription"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["pushSubscription", "upsertMySubscription"],
      (clientApi) => clientApi.pushSubscription.upsertMySubscription.mutate,
      input,
      this.toAppError,
    );

  queryPushSubscriptionGetVapidPublicKey: ProcedureFn<
    TrpcClientApi["pushSubscription"]["getVapidPublicKey"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["pushSubscription", "getVapidPublicKey"],
      (clientApi) => clientApi.pushSubscription.getVapidPublicKey.query,
      input,
      this.toAppError,
    );

  queryUserNotificationListMy: ProcedureFn<
    TrpcClientApi["userNotification"]["listMy"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["userNotification", "listMy"],
      (clientApi) => clientApi.userNotification.listMy.query,
      input,
      this.toAppError,
    );

  queryUserNotificationUnreadCount: ProcedureFn<
    TrpcClientApi["userNotification"]["unreadCount"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["userNotification", "unreadCount"],
      (clientApi) => clientApi.userNotification.unreadCount.query,
      input,
      this.toAppError,
    );
}

export const createNotificationsApi = (deps: NotificationsApiDeps = {}) =>
  new NotificationsApi(deps);

const NOTIFICATIONS_API_SINGLETON = createNotificationsApi();

export const getNotificationsApi = () => NOTIFICATIONS_API_SINGLETON;
