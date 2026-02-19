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

export class AdminApi {
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
      (clientApi) => clientApi.admin.claim.approve.mutate,
      input,
      this.toAppError,
    );

  mutAdminClaimReject = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "claim", "reject"],
      (clientApi) => clientApi.admin.claim.reject.mutate,
      input,
      this.toAppError,
    );

  mutAdminCourtActivate = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "court", "activate"],
      (clientApi) => clientApi.admin.court.activate.mutate,
      input,
      this.toAppError,
    );

  mutAdminCourtCreateCurated = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "court", "createCurated"],
      (clientApi) => clientApi.admin.court.createCurated.mutate,
      input,
      this.toAppError,
    );

  mutAdminCourtCreateCuratedBatch = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "court", "createCuratedBatch"],
      (clientApi) => clientApi.admin.court.createCuratedBatch.mutate,
      input,
      this.toAppError,
    );

  mutAdminCourtDeactivate = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "court", "deactivate"],
      (clientApi) => clientApi.admin.court.deactivate.mutate,
      input,
      this.toAppError,
    );

  mutAdminCourtDeletePlace = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "court", "deletePlace"],
      (clientApi) => clientApi.admin.court.deletePlace.mutate,
      input,
      this.toAppError,
    );

  mutAdminCourtRecurate = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "court", "recurate"],
      (clientApi) => clientApi.admin.court.recurate.mutate,
      input,
      this.toAppError,
    );

  mutAdminCourtRemovePhoto = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "court", "removePhoto"],
      (clientApi) => clientApi.admin.court.removePhoto.mutate,
      input,
      this.toAppError,
    );

  mutAdminCourtTransfer = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "court", "transfer"],
      (clientApi) => clientApi.admin.court.transfer.mutate,
      input,
      this.toAppError,
    );

  mutAdminCourtUpdate = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "court", "update"],
      (clientApi) => clientApi.admin.court.update.mutate,
      input,
      this.toAppError,
    );

  mutAdminCourtUploadPhoto = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "court", "uploadPhoto"],
      (clientApi) => clientApi.admin.court.uploadPhoto.mutate,
      input,
      this.toAppError,
    );

  mutAdminPlaceVerificationApprove = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "placeVerification", "approve"],
      (clientApi) => clientApi.admin.placeVerification.approve.mutate,
      input,
      this.toAppError,
    );

  mutAdminPlaceVerificationReject = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "placeVerification", "reject"],
      (clientApi) => clientApi.admin.placeVerification.reject.mutate,
      input,
      this.toAppError,
    );

  queryAdminClaimGetById = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["admin", "claim", "getById"],
      (clientApi) => clientApi.admin.claim.getById.query,
      input,
      this.toAppError,
    );

  queryAdminClaimGetPending = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["admin", "claim", "getPending"],
      (clientApi) => clientApi.admin.claim.getPending.query,
      input,
      this.toAppError,
    );

  queryAdminCourtGetById = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["admin", "court", "getById"],
      (clientApi) => clientApi.admin.court.getById.query,
      input,
      this.toAppError,
    );

  queryAdminCourtList = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["admin", "court", "list"],
      (clientApi) => clientApi.admin.court.list.query,
      input,
      this.toAppError,
    );

  queryAdminCourtStats = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["admin", "court", "stats"],
      (clientApi) => clientApi.admin.court.stats.query,
      input,
      this.toAppError,
    );

  queryAdminPlaceVerificationGetById = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["admin", "placeVerification", "getById"],
      (clientApi) => clientApi.admin.placeVerification.getById.query,
      input,
      this.toAppError,
    );

  queryAdminPlaceVerificationGetPending = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["admin", "placeVerification", "getPending"],
      (clientApi) => clientApi.admin.placeVerification.getPending.query,
      input,
      this.toAppError,
    );

  querySportList = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["sport", "list"],
      (clientApi) => clientApi.sport.list.query,
      input,
      this.toAppError,
    );

  queryAdminOrganizationSearch = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["admin", "organization", "search"],
      (clientApi) => clientApi.admin.organization.search.query,
      input,
      this.toAppError,
    );

  mutAdminNotificationDeliveryDispatchNow = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "notificationDelivery", "dispatchNow"],
      (clientApi) => clientApi.admin.notificationDelivery.dispatchNow.mutate,
      input,
      this.toAppError,
    );

  mutAdminNotificationDeliveryEnqueueReservationCreatedTest = async (
    input?: unknown,
  ) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "notificationDelivery", "enqueueReservationCreatedTest"],
      (clientApi) =>
        clientApi.admin.notificationDelivery.enqueueReservationCreatedTest
          .mutate,
      input,
      this.toAppError,
    );

  mutAdminNotificationDeliveryEnqueuePlaceVerificationReviewedTest = async (
    input?: unknown,
  ) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "notificationDelivery", "enqueuePlaceVerificationReviewedTest"],
      (clientApi) =>
        clientApi.admin.notificationDelivery
          .enqueuePlaceVerificationReviewedTest.mutate,
      input,
      this.toAppError,
    );

  mutAdminNotificationDeliveryEnqueueClaimReviewedTest = async (
    input?: unknown,
  ) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "notificationDelivery", "enqueueClaimReviewedTest"],
      (clientApi) =>
        clientApi.admin.notificationDelivery.enqueueClaimReviewedTest.mutate,
      input,
      this.toAppError,
    );

  queryAdminNotificationDeliveryListMyWebPushSubscriptions = async (
    input?: unknown,
  ) =>
    callTrpcQuery(
      this.clientApi,
      ["admin", "notificationDelivery", "listMyWebPushSubscriptions"],
      (clientApi) =>
        clientApi.admin.notificationDelivery.listMyWebPushSubscriptions.query,
      input,
      this.toAppError,
    );

  mutAdminNotificationDeliveryEnqueueWebPushTest = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "notificationDelivery", "enqueueWebPushTest"],
      (clientApi) =>
        clientApi.admin.notificationDelivery.enqueueWebPushTest.mutate,
      input,
      this.toAppError,
    );
}

export const createAdminApi = (deps: AdminApiDeps = {}) => new AdminApi(deps);

const ADMIN_API_SINGLETON = createAdminApi();

export const getAdminApi = () => ADMIN_API_SINGLETON;
