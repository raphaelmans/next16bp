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

export interface IAdminApi {
  mutAdminClaimApprove: ProcedureFn<
    TrpcClientApi["admin"]["claim"]["approve"]["mutate"]
  >;
  mutAdminClaimReject: ProcedureFn<
    TrpcClientApi["admin"]["claim"]["reject"]["mutate"]
  >;
  mutAdminCourtActivate: ProcedureFn<
    TrpcClientApi["admin"]["court"]["activate"]["mutate"]
  >;
  mutAdminCourtCreateCurated: ProcedureFn<
    TrpcClientApi["admin"]["court"]["createCurated"]["mutate"]
  >;
  mutAdminCourtCreateCuratedBatch: ProcedureFn<
    TrpcClientApi["admin"]["court"]["createCuratedBatch"]["mutate"]
  >;
  mutAdminCourtDeactivate: ProcedureFn<
    TrpcClientApi["admin"]["court"]["deactivate"]["mutate"]
  >;
  mutAdminCourtDeletePlace: ProcedureFn<
    TrpcClientApi["admin"]["court"]["deletePlace"]["mutate"]
  >;
  mutAdminCourtRecurate: ProcedureFn<
    TrpcClientApi["admin"]["court"]["recurate"]["mutate"]
  >;
  mutAdminCourtRemovePhoto: ProcedureFn<
    TrpcClientApi["admin"]["court"]["removePhoto"]["mutate"]
  >;
  mutAdminCourtTransfer: ProcedureFn<
    TrpcClientApi["admin"]["court"]["transfer"]["mutate"]
  >;
  mutAdminCourtUpdate: ProcedureFn<
    TrpcClientApi["admin"]["court"]["update"]["mutate"]
  >;
  mutAdminCourtUploadPhoto: ProcedureFn<
    TrpcClientApi["admin"]["court"]["uploadPhoto"]["mutate"]
  >;
  mutAdminPlaceVerificationApprove: ProcedureFn<
    TrpcClientApi["admin"]["placeVerification"]["approve"]["mutate"]
  >;
  mutAdminPlaceVerificationReject: ProcedureFn<
    TrpcClientApi["admin"]["placeVerification"]["reject"]["mutate"]
  >;
  queryAdminClaimGetById: ProcedureFn<
    TrpcClientApi["admin"]["claim"]["getById"]["query"]
  >;
  queryAdminClaimGetPending: ProcedureFn<
    TrpcClientApi["admin"]["claim"]["getPending"]["query"]
  >;
  queryAdminCourtGetById: ProcedureFn<
    TrpcClientApi["admin"]["court"]["getById"]["query"]
  >;
  queryAdminCourtList: ProcedureFn<
    TrpcClientApi["admin"]["court"]["list"]["query"]
  >;
  queryAdminCourtStats: ProcedureFn<
    TrpcClientApi["admin"]["court"]["stats"]["query"]
  >;
  queryAdminCourtGetOnboardingStatus: ProcedureFn<
    TrpcClientApi["admin"]["court"]["getOnboardingStatus"]["query"]
  >;
  queryAdminPlaceVerificationGetById: ProcedureFn<
    TrpcClientApi["admin"]["placeVerification"]["getById"]["query"]
  >;
  queryAdminPlaceVerificationGetPending: ProcedureFn<
    TrpcClientApi["admin"]["placeVerification"]["getPending"]["query"]
  >;
  querySportList: ProcedureFn<TrpcClientApi["sport"]["list"]["query"]>;
  queryAdminOrganizationSearch: ProcedureFn<
    TrpcClientApi["admin"]["organization"]["search"]["query"]
  >;
  mutAdminNotificationDeliveryDispatchNow: ProcedureFn<
    TrpcClientApi["admin"]["notificationDelivery"]["dispatchNow"]["mutate"]
  >;
  mutAdminNotificationDeliveryEnqueueReservationCreatedTest: ProcedureFn<
    TrpcClientApi["admin"]["notificationDelivery"]["enqueueReservationCreatedTest"]["mutate"]
  >;
  mutAdminNotificationDeliveryEnqueuePlaceVerificationReviewedTest: ProcedureFn<
    TrpcClientApi["admin"]["notificationDelivery"]["enqueuePlaceVerificationReviewedTest"]["mutate"]
  >;
  mutAdminNotificationDeliveryEnqueueClaimReviewedTest: ProcedureFn<
    TrpcClientApi["admin"]["notificationDelivery"]["enqueueClaimReviewedTest"]["mutate"]
  >;
  queryAdminNotificationDeliveryListMyWebPushSubscriptions: ProcedureFn<
    TrpcClientApi["admin"]["notificationDelivery"]["listMyWebPushSubscriptions"]["query"]
  >;
  mutAdminNotificationDeliveryEnqueueWebPushTest: ProcedureFn<
    TrpcClientApi["admin"]["notificationDelivery"]["enqueueWebPushTest"]["mutate"]
  >;
  queryAdminSubmissionList: ProcedureFn<
    TrpcClientApi["admin"]["courtSubmission"]["list"]["query"]
  >;
  mutAdminSubmissionApprove: ProcedureFn<
    TrpcClientApi["admin"]["courtSubmission"]["approve"]["mutate"]
  >;
  mutAdminSubmissionReject: ProcedureFn<
    TrpcClientApi["admin"]["courtSubmission"]["reject"]["mutate"]
  >;
  mutAdminSubmissionBanUser: ProcedureFn<
    TrpcClientApi["admin"]["courtSubmission"]["ban"]["mutate"]
  >;
  mutAdminSubmissionUnbanUser: ProcedureFn<
    TrpcClientApi["admin"]["courtSubmission"]["unban"]["mutate"]
  >;
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

  mutAdminClaimApprove: ProcedureFn<
    TrpcClientApi["admin"]["claim"]["approve"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "claim", "approve"],
      (clientApi) => clientApi.admin.claim.approve.mutate,
      input,
      this.toAppError,
    );

  mutAdminClaimReject: ProcedureFn<
    TrpcClientApi["admin"]["claim"]["reject"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "claim", "reject"],
      (clientApi) => clientApi.admin.claim.reject.mutate,
      input,
      this.toAppError,
    );

  mutAdminCourtActivate: ProcedureFn<
    TrpcClientApi["admin"]["court"]["activate"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "court", "activate"],
      (clientApi) => clientApi.admin.court.activate.mutate,
      input,
      this.toAppError,
    );

  mutAdminCourtCreateCurated: ProcedureFn<
    TrpcClientApi["admin"]["court"]["createCurated"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "court", "createCurated"],
      (clientApi) => clientApi.admin.court.createCurated.mutate,
      input,
      this.toAppError,
    );

  mutAdminCourtCreateCuratedBatch: ProcedureFn<
    TrpcClientApi["admin"]["court"]["createCuratedBatch"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "court", "createCuratedBatch"],
      (clientApi) => clientApi.admin.court.createCuratedBatch.mutate,
      input,
      this.toAppError,
    );

  mutAdminCourtDeactivate: ProcedureFn<
    TrpcClientApi["admin"]["court"]["deactivate"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "court", "deactivate"],
      (clientApi) => clientApi.admin.court.deactivate.mutate,
      input,
      this.toAppError,
    );

  mutAdminCourtDeletePlace: ProcedureFn<
    TrpcClientApi["admin"]["court"]["deletePlace"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "court", "deletePlace"],
      (clientApi) => clientApi.admin.court.deletePlace.mutate,
      input,
      this.toAppError,
    );

  mutAdminCourtRecurate: ProcedureFn<
    TrpcClientApi["admin"]["court"]["recurate"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "court", "recurate"],
      (clientApi) => clientApi.admin.court.recurate.mutate,
      input,
      this.toAppError,
    );

  mutAdminCourtRemovePhoto: ProcedureFn<
    TrpcClientApi["admin"]["court"]["removePhoto"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "court", "removePhoto"],
      (clientApi) => clientApi.admin.court.removePhoto.mutate,
      input,
      this.toAppError,
    );

  mutAdminCourtTransfer: ProcedureFn<
    TrpcClientApi["admin"]["court"]["transfer"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "court", "transfer"],
      (clientApi) => clientApi.admin.court.transfer.mutate,
      input,
      this.toAppError,
    );

  mutAdminCourtUpdate: ProcedureFn<
    TrpcClientApi["admin"]["court"]["update"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "court", "update"],
      (clientApi) => clientApi.admin.court.update.mutate,
      input,
      this.toAppError,
    );

  mutAdminCourtUploadPhoto: ProcedureFn<
    TrpcClientApi["admin"]["court"]["uploadPhoto"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "court", "uploadPhoto"],
      (clientApi) => clientApi.admin.court.uploadPhoto.mutate,
      input,
      this.toAppError,
    );

  mutAdminPlaceVerificationApprove: ProcedureFn<
    TrpcClientApi["admin"]["placeVerification"]["approve"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "placeVerification", "approve"],
      (clientApi) => clientApi.admin.placeVerification.approve.mutate,
      input,
      this.toAppError,
    );

  mutAdminPlaceVerificationReject: ProcedureFn<
    TrpcClientApi["admin"]["placeVerification"]["reject"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "placeVerification", "reject"],
      (clientApi) => clientApi.admin.placeVerification.reject.mutate,
      input,
      this.toAppError,
    );

  queryAdminClaimGetById: ProcedureFn<
    TrpcClientApi["admin"]["claim"]["getById"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["admin", "claim", "getById"],
      (clientApi) => clientApi.admin.claim.getById.query,
      input,
      this.toAppError,
    );

  queryAdminClaimGetPending: ProcedureFn<
    TrpcClientApi["admin"]["claim"]["getPending"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["admin", "claim", "getPending"],
      (clientApi) => clientApi.admin.claim.getPending.query,
      input,
      this.toAppError,
    );

  queryAdminCourtGetById: ProcedureFn<
    TrpcClientApi["admin"]["court"]["getById"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["admin", "court", "getById"],
      (clientApi) => clientApi.admin.court.getById.query,
      input,
      this.toAppError,
    );

  queryAdminCourtList: ProcedureFn<
    TrpcClientApi["admin"]["court"]["list"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["admin", "court", "list"],
      (clientApi) => clientApi.admin.court.list.query,
      input,
      this.toAppError,
    );

  queryAdminCourtStats: ProcedureFn<
    TrpcClientApi["admin"]["court"]["stats"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["admin", "court", "stats"],
      (clientApi) => clientApi.admin.court.stats.query,
      input,
      this.toAppError,
    );

  queryAdminCourtGetOnboardingStatus: ProcedureFn<
    TrpcClientApi["admin"]["court"]["getOnboardingStatus"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["admin", "court", "getOnboardingStatus"],
      (clientApi) => clientApi.admin.court.getOnboardingStatus.query,
      input,
      this.toAppError,
    );

  queryAdminPlaceVerificationGetById: ProcedureFn<
    TrpcClientApi["admin"]["placeVerification"]["getById"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["admin", "placeVerification", "getById"],
      (clientApi) => clientApi.admin.placeVerification.getById.query,
      input,
      this.toAppError,
    );

  queryAdminPlaceVerificationGetPending: ProcedureFn<
    TrpcClientApi["admin"]["placeVerification"]["getPending"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["admin", "placeVerification", "getPending"],
      (clientApi) => clientApi.admin.placeVerification.getPending.query,
      input,
      this.toAppError,
    );

  querySportList: ProcedureFn<TrpcClientApi["sport"]["list"]["query"]> = async (
    input,
  ) =>
    callTrpcQuery(
      this.clientApi,
      ["sport", "list"],
      (clientApi) => clientApi.sport.list.query,
      input,
      this.toAppError,
    );

  queryAdminOrganizationSearch: ProcedureFn<
    TrpcClientApi["admin"]["organization"]["search"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["admin", "organization", "search"],
      (clientApi) => clientApi.admin.organization.search.query,
      input,
      this.toAppError,
    );

  mutAdminNotificationDeliveryDispatchNow: ProcedureFn<
    TrpcClientApi["admin"]["notificationDelivery"]["dispatchNow"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "notificationDelivery", "dispatchNow"],
      (clientApi) => clientApi.admin.notificationDelivery.dispatchNow.mutate,
      input,
      this.toAppError,
    );

  mutAdminNotificationDeliveryEnqueueReservationCreatedTest: ProcedureFn<
    TrpcClientApi["admin"]["notificationDelivery"]["enqueueReservationCreatedTest"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "notificationDelivery", "enqueueReservationCreatedTest"],
      (clientApi) =>
        clientApi.admin.notificationDelivery.enqueueReservationCreatedTest
          .mutate,
      input,
      this.toAppError,
    );

  mutAdminNotificationDeliveryEnqueuePlaceVerificationReviewedTest: ProcedureFn<
    TrpcClientApi["admin"]["notificationDelivery"]["enqueuePlaceVerificationReviewedTest"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "notificationDelivery", "enqueuePlaceVerificationReviewedTest"],
      (clientApi) =>
        clientApi.admin.notificationDelivery
          .enqueuePlaceVerificationReviewedTest.mutate,
      input,
      this.toAppError,
    );

  mutAdminNotificationDeliveryEnqueueClaimReviewedTest: ProcedureFn<
    TrpcClientApi["admin"]["notificationDelivery"]["enqueueClaimReviewedTest"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "notificationDelivery", "enqueueClaimReviewedTest"],
      (clientApi) =>
        clientApi.admin.notificationDelivery.enqueueClaimReviewedTest.mutate,
      input,
      this.toAppError,
    );

  queryAdminNotificationDeliveryListMyWebPushSubscriptions: ProcedureFn<
    TrpcClientApi["admin"]["notificationDelivery"]["listMyWebPushSubscriptions"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["admin", "notificationDelivery", "listMyWebPushSubscriptions"],
      (clientApi) =>
        clientApi.admin.notificationDelivery.listMyWebPushSubscriptions.query,
      input,
      this.toAppError,
    );

  mutAdminNotificationDeliveryEnqueueWebPushTest: ProcedureFn<
    TrpcClientApi["admin"]["notificationDelivery"]["enqueueWebPushTest"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "notificationDelivery", "enqueueWebPushTest"],
      (clientApi) =>
        clientApi.admin.notificationDelivery.enqueueWebPushTest.mutate,
      input,
      this.toAppError,
    );

  queryAdminSubmissionList: ProcedureFn<
    TrpcClientApi["admin"]["courtSubmission"]["list"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["admin", "courtSubmission", "list"],
      (clientApi) => clientApi.admin.courtSubmission.list.query,
      input,
      this.toAppError,
    );

  mutAdminSubmissionApprove: ProcedureFn<
    TrpcClientApi["admin"]["courtSubmission"]["approve"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "courtSubmission", "approve"],
      (clientApi) => clientApi.admin.courtSubmission.approve.mutate,
      input,
      this.toAppError,
    );

  mutAdminSubmissionReject: ProcedureFn<
    TrpcClientApi["admin"]["courtSubmission"]["reject"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "courtSubmission", "reject"],
      (clientApi) => clientApi.admin.courtSubmission.reject.mutate,
      input,
      this.toAppError,
    );

  mutAdminSubmissionBanUser: ProcedureFn<
    TrpcClientApi["admin"]["courtSubmission"]["ban"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "courtSubmission", "ban"],
      (clientApi) => clientApi.admin.courtSubmission.ban.mutate,
      input,
      this.toAppError,
    );

  mutAdminSubmissionUnbanUser: ProcedureFn<
    TrpcClientApi["admin"]["courtSubmission"]["unban"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["admin", "courtSubmission", "unban"],
      (clientApi) => clientApi.admin.courtSubmission.unban.mutate,
      input,
      this.toAppError,
    );
}

export const createAdminApi = (deps: AdminApiDeps = {}) => new AdminApi(deps);

const ADMIN_API_SINGLETON = createAdminApi();

export const getAdminApi = () => ADMIN_API_SINGLETON;
