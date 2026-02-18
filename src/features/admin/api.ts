"use client";

import type { AppError } from "@/common/errors/app-error";
import { toAppError as defaultToAppError } from "@/common/errors/to-app-error";
import { callTrpcMutation, callTrpcQuery } from "@/common/trpc-client-call";
import { getClientApi, type TrpcClientApi } from "@/trpc/client-api";

export interface IAdminApi {
  mutAdminClaimApprove: (input?: unknown) => Promise<unknown>;
  mutAdminClaimReject: (input?: unknown) => Promise<unknown>;
  mutAdminCourtActivate: (input?: unknown) => Promise<unknown>;
  mutAdminCourtCreateCurated: (input?: unknown) => Promise<unknown>;
  mutAdminCourtCreateCuratedBatch: (input?: unknown) => Promise<unknown>;
  mutAdminCourtDeactivate: (input?: unknown) => Promise<unknown>;
  mutAdminCourtDeletePlace: (input?: unknown) => Promise<unknown>;
  mutAdminCourtRecurate: (input?: unknown) => Promise<unknown>;
  mutAdminCourtRemovePhoto: (input?: unknown) => Promise<unknown>;
  mutAdminCourtTransfer: (input?: unknown) => Promise<unknown>;
  mutAdminCourtUpdate: (input?: unknown) => Promise<unknown>;
  mutAdminCourtUploadPhoto: (input?: unknown) => Promise<unknown>;
  mutAdminPlaceVerificationApprove: (input?: unknown) => Promise<unknown>;
  mutAdminPlaceVerificationReject: (input?: unknown) => Promise<unknown>;
  queryAdminClaimGetById: (input?: unknown) => Promise<unknown>;
  queryAdminClaimGetPending: (input?: unknown) => Promise<unknown>;
  queryAdminCourtGetById: (input?: unknown) => Promise<unknown>;
  queryAdminCourtList: (input?: unknown) => Promise<unknown>;
  queryAdminCourtStats: (input?: unknown) => Promise<unknown>;
  queryAdminPlaceVerificationGetById: (input?: unknown) => Promise<unknown>;
  queryAdminPlaceVerificationGetPending: (input?: unknown) => Promise<unknown>;
  querySportList: (input?: unknown) => Promise<unknown>;
  queryAdminOrganizationSearch: (input?: unknown) => Promise<unknown>;
  mutAdminNotificationDeliveryDispatchNow: (
    input?: unknown,
  ) => Promise<unknown>;
  mutAdminNotificationDeliveryEnqueueReservationCreatedTest: (
    input?: unknown,
  ) => Promise<unknown>;
  mutAdminNotificationDeliveryEnqueuePlaceVerificationReviewedTest: (
    input?: unknown,
  ) => Promise<unknown>;
  mutAdminNotificationDeliveryEnqueueClaimReviewedTest: (
    input?: unknown,
  ) => Promise<unknown>;
  queryAdminNotificationDeliveryListMyWebPushSubscriptions: (
    input?: unknown,
  ) => Promise<unknown>;
  mutAdminNotificationDeliveryEnqueueWebPushTest: (
    input?: unknown,
  ) => Promise<unknown>;
}

export type AdminApiDeps = {
  clientApi?: TrpcClientApi;
  toAppError?: (err: unknown) => AppError;
};

export class AdminApi implements IAdminApi {
  readonly clientApi: TrpcClientApi;
  private readonly toAppError: (err: unknown) => AppError;

  constructor(deps: AdminApiDeps = {}) {
    this.clientApi = deps.clientApi ?? getClientApi();
    this.toAppError = deps.toAppError ?? defaultToAppError;
  }

  mutAdminClaimApprove = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "claim", "approve"],
      input,
      this.toAppError,
    );

  mutAdminClaimReject = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "claim", "reject"],
      input,
      this.toAppError,
    );

  mutAdminCourtActivate = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "court", "activate"],
      input,
      this.toAppError,
    );

  mutAdminCourtCreateCurated = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "court", "createCurated"],
      input,
      this.toAppError,
    );

  mutAdminCourtCreateCuratedBatch = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "court", "createCuratedBatch"],
      input,
      this.toAppError,
    );

  mutAdminCourtDeactivate = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "court", "deactivate"],
      input,
      this.toAppError,
    );

  mutAdminCourtDeletePlace = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "court", "deletePlace"],
      input,
      this.toAppError,
    );

  mutAdminCourtRecurate = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "court", "recurate"],
      input,
      this.toAppError,
    );

  mutAdminCourtRemovePhoto = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "court", "removePhoto"],
      input,
      this.toAppError,
    );

  mutAdminCourtTransfer = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "court", "transfer"],
      input,
      this.toAppError,
    );

  mutAdminCourtUpdate = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "court", "update"],
      input,
      this.toAppError,
    );

  mutAdminCourtUploadPhoto = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "court", "uploadPhoto"],
      input,
      this.toAppError,
    );

  mutAdminPlaceVerificationApprove = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "placeVerification", "approve"],
      input,
      this.toAppError,
    );

  mutAdminPlaceVerificationReject = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "placeVerification", "reject"],
      input,
      this.toAppError,
    );

  queryAdminClaimGetById = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["admin", "claim", "getById"],
      input,
      this.toAppError,
    );

  queryAdminClaimGetPending = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["admin", "claim", "getPending"],
      input,
      this.toAppError,
    );

  queryAdminCourtGetById = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["admin", "court", "getById"],
      input,
      this.toAppError,
    );

  queryAdminCourtList = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["admin", "court", "list"],
      input,
      this.toAppError,
    );

  queryAdminCourtStats = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["admin", "court", "stats"],
      input,
      this.toAppError,
    );

  queryAdminPlaceVerificationGetById = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["admin", "placeVerification", "getById"],
      input,
      this.toAppError,
    );

  queryAdminPlaceVerificationGetPending = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["admin", "placeVerification", "getPending"],
      input,
      this.toAppError,
    );

  querySportList = async (input?: unknown) =>
    callTrpcQuery(this.clientApi, ["sport", "list"], input, this.toAppError);

  queryAdminOrganizationSearch = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["admin", "organization", "search"],
      input,
      this.toAppError,
    );

  mutAdminNotificationDeliveryDispatchNow = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "notificationDelivery", "dispatchNow"],
      input,
      this.toAppError,
    );

  mutAdminNotificationDeliveryEnqueueReservationCreatedTest = async (
    input?: unknown,
  ) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "notificationDelivery", "enqueueReservationCreatedTest"],
      input,
      this.toAppError,
    );

  mutAdminNotificationDeliveryEnqueuePlaceVerificationReviewedTest = async (
    input?: unknown,
  ) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "notificationDelivery", "enqueuePlaceVerificationReviewedTest"],
      input,
      this.toAppError,
    );

  mutAdminNotificationDeliveryEnqueueClaimReviewedTest = async (
    input?: unknown,
  ) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "notificationDelivery", "enqueueClaimReviewedTest"],
      input,
      this.toAppError,
    );

  queryAdminNotificationDeliveryListMyWebPushSubscriptions = async (
    input?: unknown,
  ) =>
    callTrpcQuery(
      this.clientApi,
      ["admin", "notificationDelivery", "listMyWebPushSubscriptions"],
      input,
      this.toAppError,
    );

  mutAdminNotificationDeliveryEnqueueWebPushTest = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "notificationDelivery", "enqueueWebPushTest"],
      input,
      this.toAppError,
    );
}

export const createAdminApi = (deps: AdminApiDeps = {}): IAdminApi =>
  new AdminApi(deps);

const ADMIN_API_SINGLETON = createAdminApi();

export const getAdminApi = (): IAdminApi => ADMIN_API_SINGLETON;
