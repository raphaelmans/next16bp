"use client";

import type { AppError } from "@/common/errors/app-error";
import { toAppError as defaultToAppError } from "@/common/errors/to-app-error";
import { callTrpcMutation, callTrpcQuery } from "@/common/trpc-client-call";
import { getClientApi, type TrpcClientApi } from "@/trpc/client-api";

export interface IOwnerApi {
  mutCourtHoursCopyFromCourt: (input?: unknown) => Promise<unknown>;
  mutCourtHoursSet: (input?: unknown) => Promise<unknown>;
  mutCourtManagementCreate: (input?: unknown) => Promise<unknown>;
  mutCourtManagementUpdate: (input?: unknown) => Promise<unknown>;
  mutCourtRateRuleCopyFromCourt: (input?: unknown) => Promise<unknown>;
  mutCourtRateRuleSet: (input?: unknown) => Promise<unknown>;
  mutOrganizationPaymentCreateMethod: (input?: unknown) => Promise<unknown>;
  mutOrganizationPaymentDeleteMethod: (input?: unknown) => Promise<unknown>;
  mutOrganizationPaymentSetDefault: (input?: unknown) => Promise<unknown>;
  mutOrganizationPaymentUpdateMethod: (input?: unknown) => Promise<unknown>;
  mutOrganizationUpdate: (input?: unknown) => Promise<unknown>;
  mutOrganizationUpdateProfile: (input?: unknown) => Promise<unknown>;
  mutOrganizationUploadLogo: (input?: unknown) => Promise<unknown>;
  mutPlaceManagementCreate: (input?: unknown) => Promise<unknown>;
  mutPlaceManagementRemovePhoto: (input?: unknown) => Promise<unknown>;
  mutPlaceManagementReorderPhotos: (input?: unknown) => Promise<unknown>;
  mutPlaceManagementUpdate: (input?: unknown) => Promise<unknown>;
  mutPlaceManagementUploadPhoto: (input?: unknown) => Promise<unknown>;
  mutPlaceVerificationSubmit: (input?: unknown) => Promise<unknown>;
  mutPlaceVerificationToggleReservations: (input?: unknown) => Promise<unknown>;
  mutReservationOwnerAccept: (input?: unknown) => Promise<unknown>;
  mutReservationOwnerConfirmPayment: (input?: unknown) => Promise<unknown>;
  mutReservationOwnerReject: (input?: unknown) => Promise<unknown>;
  queryCourtHoursGet: (input?: unknown) => Promise<unknown>;
  queryCourtManagementGetById: (input?: unknown) => Promise<unknown>;
  queryCourtManagementListByPlace: (input?: unknown) => Promise<unknown>;
  queryCourtRateRuleGet: (input?: unknown) => Promise<unknown>;
  queryOrganizationGet: (input?: unknown) => Promise<unknown>;
  queryOrganizationMy: (input?: unknown) => Promise<unknown>;
  queryOrganizationPaymentListMethods: (input?: unknown) => Promise<unknown>;
  queryOwnerSetupGetStatus: (input?: unknown) => Promise<unknown>;
  queryPlaceManagementGetById: (input?: unknown) => Promise<unknown>;
  queryPlaceManagementList: (input?: unknown) => Promise<unknown>;
  queryPlaceVerificationGetByPlace: (input?: unknown) => Promise<unknown>;
  queryReservationOwnerGetForOrganization: (
    input?: unknown,
  ) => Promise<unknown>;
  queryReservationOwnerGetPendingCount: (input?: unknown) => Promise<unknown>;
  querySportList: (input?: unknown) => Promise<unknown>;
  queryCourtBlockListForCourtRange: (input?: unknown) => Promise<unknown>;
  mutCourtBlockUpdateRange: (input?: unknown) => Promise<unknown>;
  mutCourtBlockCreateMaintenance: (input?: unknown) => Promise<unknown>;
  mutCourtBlockCreateWalkIn: (input?: unknown) => Promise<unknown>;
  mutCourtBlockCancel: (input?: unknown) => Promise<unknown>;
  queryReservationOwnerGetActiveForCourtRange: (
    input?: unknown,
  ) => Promise<unknown>;
  mutReservationOwnerCreateGuestBooking: (input?: unknown) => Promise<unknown>;
  mutReservationOwnerConvertWalkInBlockToGuest: (
    input?: unknown,
  ) => Promise<unknown>;
  queryGuestProfileList: (input?: unknown) => Promise<unknown>;
  mutGuestProfileCreate: (input?: unknown) => Promise<unknown>;
  queryClaimRequestGetMy: (input?: unknown) => Promise<unknown>;
  queryClaimRequestGetById: (input?: unknown) => Promise<unknown>;
  mutClaimRequestSubmitClaim: (input?: unknown) => Promise<unknown>;
  queryPlaceList: (input?: unknown) => Promise<unknown>;
  queryPlaceGetById: (input?: unknown) => Promise<unknown>;
  mutPlaceManagementDelete: (input?: unknown) => Promise<unknown>;
  queryBookingsImportAiUsage: (input?: unknown) => Promise<unknown>;
  queryBookingsImportGetJob: (input?: unknown) => Promise<unknown>;
  queryBookingsImportListRows: (input?: unknown) => Promise<unknown>;
  queryBookingsImportListSources: (input?: unknown) => Promise<unknown>;
  mutBookingsImportCreateDraft: (input?: unknown) => Promise<unknown>;
  mutBookingsImportNormalize: (input?: unknown) => Promise<unknown>;
  mutBookingsImportUpdateRow: (input?: unknown) => Promise<unknown>;
  mutBookingsImportDeleteRow: (input?: unknown) => Promise<unknown>;
  mutBookingsImportDiscardJob: (input?: unknown) => Promise<unknown>;
  mutBookingsImportCommit: (input?: unknown) => Promise<unknown>;
  mutBookingsImportReplaceWithGuest: (input?: unknown) => Promise<unknown>;
  mutReservationOwnerConfirmPaidOffline: (input?: unknown) => Promise<unknown>;
  queryAuditReservationHistory: (input?: unknown) => Promise<unknown>;
}

export type OwnerApiDeps = {
  clientApi?: TrpcClientApi;
  toAppError?: (err: unknown) => AppError;
};

export class OwnerApi {
  readonly clientApi: TrpcClientApi;
  private readonly toAppError: (err: unknown) => AppError;

  constructor(deps: OwnerApiDeps = {}) {
    this.clientApi = deps.clientApi ?? getClientApi();
    this.toAppError = deps.toAppError ?? defaultToAppError;
  }

  mutCourtHoursCopyFromCourt = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["courtHours", "copyFromCourt"],
      (clientApi) => clientApi.courtHours.copyFromCourt.mutate,
      input,
      this.toAppError,
    );

  mutCourtHoursSet = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["courtHours", "set"],
      (clientApi) => clientApi.courtHours.set.mutate,
      input,
      this.toAppError,
    );

  mutCourtManagementCreate = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["courtManagement", "create"],
      (clientApi) => clientApi.courtManagement.create.mutate,
      input,
      this.toAppError,
    );

  mutCourtManagementUpdate = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["courtManagement", "update"],
      (clientApi) => clientApi.courtManagement.update.mutate,
      input,
      this.toAppError,
    );

  mutCourtRateRuleCopyFromCourt = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["courtRateRule", "copyFromCourt"],
      (clientApi) => clientApi.courtRateRule.copyFromCourt.mutate,
      input,
      this.toAppError,
    );

  mutCourtRateRuleSet = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["courtRateRule", "set"],
      (clientApi) => clientApi.courtRateRule.set.mutate,
      input,
      this.toAppError,
    );

  mutOrganizationPaymentCreateMethod = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["organizationPayment", "createMethod"],
      (clientApi) => clientApi.organizationPayment.createMethod.mutate,
      input,
      this.toAppError,
    );

  mutOrganizationPaymentDeleteMethod = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["organizationPayment", "deleteMethod"],
      (clientApi) => clientApi.organizationPayment.deleteMethod.mutate,
      input,
      this.toAppError,
    );

  mutOrganizationPaymentSetDefault = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["organizationPayment", "setDefault"],
      (clientApi) => clientApi.organizationPayment.setDefault.mutate,
      input,
      this.toAppError,
    );

  mutOrganizationPaymentUpdateMethod = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["organizationPayment", "updateMethod"],
      (clientApi) => clientApi.organizationPayment.updateMethod.mutate,
      input,
      this.toAppError,
    );

  mutOrganizationUpdate = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["organization", "update"],
      (clientApi) => clientApi.organization.update.mutate,
      input,
      this.toAppError,
    );

  mutOrganizationUpdateProfile = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["organization", "updateProfile"],
      (clientApi) => clientApi.organization.updateProfile.mutate,
      input,
      this.toAppError,
    );

  mutOrganizationUploadLogo = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["organization", "uploadLogo"],
      (clientApi) => clientApi.organization.uploadLogo.mutate,
      input,
      this.toAppError,
    );

  mutPlaceManagementCreate = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["placeManagement", "create"],
      (clientApi) => clientApi.placeManagement.create.mutate,
      input,
      this.toAppError,
    );

  mutPlaceManagementRemovePhoto = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["placeManagement", "removePhoto"],
      (clientApi) => clientApi.placeManagement.removePhoto.mutate,
      input,
      this.toAppError,
    );

  mutPlaceManagementReorderPhotos = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["placeManagement", "reorderPhotos"],
      (clientApi) => clientApi.placeManagement.reorderPhotos.mutate,
      input,
      this.toAppError,
    );

  mutPlaceManagementUpdate = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["placeManagement", "update"],
      (clientApi) => clientApi.placeManagement.update.mutate,
      input,
      this.toAppError,
    );

  mutPlaceManagementUploadPhoto = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["placeManagement", "uploadPhoto"],
      (clientApi) => clientApi.placeManagement.uploadPhoto.mutate,
      input,
      this.toAppError,
    );

  mutPlaceVerificationSubmit = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["placeVerification", "submit"],
      (clientApi) => clientApi.placeVerification.submit.mutate,
      input,
      this.toAppError,
    );

  mutPlaceVerificationToggleReservations = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["placeVerification", "toggleReservations"],
      (clientApi) => clientApi.placeVerification.toggleReservations.mutate,
      input,
      this.toAppError,
    );

  mutReservationOwnerAccept = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["reservationOwner", "accept"],
      (clientApi) => clientApi.reservationOwner.accept.mutate,
      input,
      this.toAppError,
    );

  mutReservationOwnerConfirmPayment = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["reservationOwner", "confirmPayment"],
      (clientApi) => clientApi.reservationOwner.confirmPayment.mutate,
      input,
      this.toAppError,
    );

  mutReservationOwnerReject = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["reservationOwner", "reject"],
      (clientApi) => clientApi.reservationOwner.reject.mutate,
      input,
      this.toAppError,
    );

  queryCourtHoursGet = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["courtHours", "get"],
      (clientApi) => clientApi.courtHours.get.query,
      input,
      this.toAppError,
    );

  queryCourtManagementGetById = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["courtManagement", "getById"],
      (clientApi) => clientApi.courtManagement.getById.query,
      input,
      this.toAppError,
    );

  queryCourtManagementListByPlace = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["courtManagement", "listByPlace"],
      (clientApi) => clientApi.courtManagement.listByPlace.query,
      input,
      this.toAppError,
    );

  queryCourtRateRuleGet = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["courtRateRule", "get"],
      (clientApi) => clientApi.courtRateRule.get.query,
      input,
      this.toAppError,
    );

  queryOrganizationGet = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["organization", "get"],
      (clientApi) => clientApi.organization.get.query,
      input,
      this.toAppError,
    );

  queryOrganizationMy = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["organization", "my"],
      (clientApi) => clientApi.organization.my.query,
      input,
      this.toAppError,
    );

  queryOrganizationPaymentListMethods = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["organizationPayment", "listMethods"],
      (clientApi) => clientApi.organizationPayment.listMethods.query,
      input,
      this.toAppError,
    );

  queryOwnerSetupGetStatus = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["ownerSetup", "getStatus"],
      (clientApi) => clientApi.ownerSetup.getStatus.query,
      input,
      this.toAppError,
    );

  queryPlaceManagementGetById = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["placeManagement", "getById"],
      (clientApi) => clientApi.placeManagement.getById.query,
      input,
      this.toAppError,
    );

  queryPlaceManagementList = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["placeManagement", "list"],
      (clientApi) => clientApi.placeManagement.list.query,
      input,
      this.toAppError,
    );

  queryPlaceVerificationGetByPlace = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["placeVerification", "getByPlace"],
      (clientApi) => clientApi.placeVerification.getByPlace.query,
      input,
      this.toAppError,
    );

  queryReservationOwnerGetForOrganization = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["reservationOwner", "getForOrganization"],
      (clientApi) => clientApi.reservationOwner.getForOrganization.query,
      input,
      this.toAppError,
    );

  queryReservationOwnerGetPendingCount = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["reservationOwner", "getPendingCount"],
      (clientApi) => clientApi.reservationOwner.getPendingCount.query,
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

  queryCourtBlockListForCourtRange = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["courtBlock", "listForCourtRange"],
      (clientApi) => clientApi.courtBlock.listForCourtRange.query,
      input,
      this.toAppError,
    );

  mutCourtBlockUpdateRange = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["courtBlock", "updateRange"],
      (clientApi) => clientApi.courtBlock.updateRange.mutate,
      input,
      this.toAppError,
    );

  mutCourtBlockCreateMaintenance = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["courtBlock", "createMaintenance"],
      (clientApi) => clientApi.courtBlock.createMaintenance.mutate,
      input,
      this.toAppError,
    );

  mutCourtBlockCreateWalkIn = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["courtBlock", "createWalkIn"],
      (clientApi) => clientApi.courtBlock.createWalkIn.mutate,
      input,
      this.toAppError,
    );

  mutCourtBlockCancel = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["courtBlock", "cancel"],
      (clientApi) => clientApi.courtBlock.cancel.mutate,
      input,
      this.toAppError,
    );

  queryReservationOwnerGetActiveForCourtRange = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["reservationOwner", "getActiveForCourtRange"],
      (clientApi) => clientApi.reservationOwner.getActiveForCourtRange.query,
      input,
      this.toAppError,
    );

  mutReservationOwnerCreateGuestBooking = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["reservationOwner", "createGuestBooking"],
      (clientApi) => clientApi.reservationOwner.createGuestBooking.mutate,
      input,
      this.toAppError,
    );

  mutReservationOwnerConvertWalkInBlockToGuest = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["reservationOwner", "convertWalkInBlockToGuest"],
      (clientApi) =>
        clientApi.reservationOwner.convertWalkInBlockToGuest.mutate,
      input,
      this.toAppError,
    );

  queryGuestProfileList = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["guestProfile", "list"],
      (clientApi) => clientApi.guestProfile.list.query,
      input,
      this.toAppError,
    );

  mutGuestProfileCreate = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["guestProfile", "create"],
      (clientApi) => clientApi.guestProfile.create.mutate,
      input,
      this.toAppError,
    );

  queryClaimRequestGetMy = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["claimRequest", "getMy"],
      (clientApi) => clientApi.claimRequest.getMy.query,
      input,
      this.toAppError,
    );

  queryClaimRequestGetById = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["claimRequest", "getById"],
      (clientApi) => clientApi.claimRequest.getById.query,
      input,
      this.toAppError,
    );

  mutClaimRequestSubmitClaim = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["claimRequest", "submitClaim"],
      (clientApi) => clientApi.claimRequest.submitClaim.mutate,
      input,
      this.toAppError,
    );

  queryPlaceList = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["place", "list"],
      (clientApi) => clientApi.place.list.query,
      input,
      this.toAppError,
    );

  queryPlaceGetById = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["place", "getById"],
      (clientApi) => clientApi.place.getById.query,
      input,
      this.toAppError,
    );

  mutPlaceManagementDelete = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["placeManagement", "delete"],
      (clientApi) => clientApi.placeManagement.delete.mutate,
      input,
      this.toAppError,
    );

  queryBookingsImportAiUsage = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["bookingsImport", "aiUsage"],
      (clientApi) => clientApi.bookingsImport.aiUsage.query,
      input,
      this.toAppError,
    );

  queryBookingsImportGetJob = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["bookingsImport", "getJob"],
      (clientApi) => clientApi.bookingsImport.getJob.query,
      input,
      this.toAppError,
    );

  queryBookingsImportListRows = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["bookingsImport", "listRows"],
      (clientApi) => clientApi.bookingsImport.listRows.query,
      input,
      this.toAppError,
    );

  queryBookingsImportListSources = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["bookingsImport", "listSources"],
      (clientApi) => clientApi.bookingsImport.listSources.query,
      input,
      this.toAppError,
    );

  mutBookingsImportCreateDraft = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["bookingsImport", "createDraft"],
      (clientApi) => clientApi.bookingsImport.createDraft.mutate,
      input,
      this.toAppError,
    );

  mutBookingsImportNormalize = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["bookingsImport", "normalize"],
      (clientApi) => clientApi.bookingsImport.normalize.mutate,
      input,
      this.toAppError,
    );

  mutBookingsImportUpdateRow = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["bookingsImport", "updateRow"],
      (clientApi) => clientApi.bookingsImport.updateRow.mutate,
      input,
      this.toAppError,
    );

  mutBookingsImportDeleteRow = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["bookingsImport", "deleteRow"],
      (clientApi) => clientApi.bookingsImport.deleteRow.mutate,
      input,
      this.toAppError,
    );

  mutBookingsImportDiscardJob = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["bookingsImport", "discardJob"],
      (clientApi) => clientApi.bookingsImport.discardJob.mutate,
      input,
      this.toAppError,
    );

  mutBookingsImportCommit = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["bookingsImport", "commit"],
      (clientApi) => clientApi.bookingsImport.commit.mutate,
      input,
      this.toAppError,
    );

  mutBookingsImportReplaceWithGuest = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["bookingsImport", "replaceWithGuest"],
      (clientApi) => clientApi.bookingsImport.replaceWithGuest.mutate,
      input,
      this.toAppError,
    );

  mutReservationOwnerConfirmPaidOffline = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["reservationOwner", "confirmPaidOffline"],
      (clientApi) => clientApi.reservationOwner.confirmPaidOffline.mutate,
      input,
      this.toAppError,
    );

  queryAuditReservationHistory = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["audit", "reservationHistory"],
      (clientApi) => clientApi.audit.reservationHistory.query,
      input,
      this.toAppError,
    );
}

export const createOwnerApi = (deps: OwnerApiDeps = {}) => new OwnerApi(deps);

const OWNER_API_SINGLETON = createOwnerApi();

export const getOwnerApi = () => OWNER_API_SINGLETON;
