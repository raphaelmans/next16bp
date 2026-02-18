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

export class OwnerApi implements IOwnerApi {
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
      input,
      this.toAppError,
    );

  mutCourtHoursSet = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["courtHours", "set"],
      input,
      this.toAppError,
    );

  mutCourtManagementCreate = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["courtManagement", "create"],
      input,
      this.toAppError,
    );

  mutCourtManagementUpdate = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["courtManagement", "update"],
      input,
      this.toAppError,
    );

  mutCourtRateRuleCopyFromCourt = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["courtRateRule", "copyFromCourt"],
      input,
      this.toAppError,
    );

  mutCourtRateRuleSet = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["courtRateRule", "set"],
      input,
      this.toAppError,
    );

  mutOrganizationPaymentCreateMethod = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["organizationPayment", "createMethod"],
      input,
      this.toAppError,
    );

  mutOrganizationPaymentDeleteMethod = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["organizationPayment", "deleteMethod"],
      input,
      this.toAppError,
    );

  mutOrganizationPaymentSetDefault = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["organizationPayment", "setDefault"],
      input,
      this.toAppError,
    );

  mutOrganizationPaymentUpdateMethod = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["organizationPayment", "updateMethod"],
      input,
      this.toAppError,
    );

  mutOrganizationUpdate = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["organization", "update"],
      input,
      this.toAppError,
    );

  mutOrganizationUpdateProfile = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["organization", "updateProfile"],
      input,
      this.toAppError,
    );

  mutOrganizationUploadLogo = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["organization", "uploadLogo"],
      input,
      this.toAppError,
    );

  mutPlaceManagementCreate = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["placeManagement", "create"],
      input,
      this.toAppError,
    );

  mutPlaceManagementRemovePhoto = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["placeManagement", "removePhoto"],
      input,
      this.toAppError,
    );

  mutPlaceManagementReorderPhotos = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["placeManagement", "reorderPhotos"],
      input,
      this.toAppError,
    );

  mutPlaceManagementUpdate = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["placeManagement", "update"],
      input,
      this.toAppError,
    );

  mutPlaceManagementUploadPhoto = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["placeManagement", "uploadPhoto"],
      input,
      this.toAppError,
    );

  mutPlaceVerificationSubmit = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["placeVerification", "submit"],
      input,
      this.toAppError,
    );

  mutPlaceVerificationToggleReservations = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["placeVerification", "toggleReservations"],
      input,
      this.toAppError,
    );

  mutReservationOwnerAccept = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["reservationOwner", "accept"],
      input,
      this.toAppError,
    );

  mutReservationOwnerConfirmPayment = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["reservationOwner", "confirmPayment"],
      input,
      this.toAppError,
    );

  mutReservationOwnerReject = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["reservationOwner", "reject"],
      input,
      this.toAppError,
    );

  queryCourtHoursGet = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["courtHours", "get"],
      input,
      this.toAppError,
    );

  queryCourtManagementGetById = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["courtManagement", "getById"],
      input,
      this.toAppError,
    );

  queryCourtManagementListByPlace = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["courtManagement", "listByPlace"],
      input,
      this.toAppError,
    );

  queryCourtRateRuleGet = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["courtRateRule", "get"],
      input,
      this.toAppError,
    );

  queryOrganizationGet = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["organization", "get"],
      input,
      this.toAppError,
    );

  queryOrganizationMy = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["organization", "my"],
      input,
      this.toAppError,
    );

  queryOrganizationPaymentListMethods = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["organizationPayment", "listMethods"],
      input,
      this.toAppError,
    );

  queryOwnerSetupGetStatus = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["ownerSetup", "getStatus"],
      input,
      this.toAppError,
    );

  queryPlaceManagementGetById = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["placeManagement", "getById"],
      input,
      this.toAppError,
    );

  queryPlaceManagementList = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["placeManagement", "list"],
      input,
      this.toAppError,
    );

  queryPlaceVerificationGetByPlace = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["placeVerification", "getByPlace"],
      input,
      this.toAppError,
    );

  queryReservationOwnerGetForOrganization = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["reservationOwner", "getForOrganization"],
      input,
      this.toAppError,
    );

  queryReservationOwnerGetPendingCount = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["reservationOwner", "getPendingCount"],
      input,
      this.toAppError,
    );

  querySportList = async (input?: unknown) =>
    callTrpcQuery(this.clientApi, ["sport", "list"], input, this.toAppError);

  queryCourtBlockListForCourtRange = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["courtBlock", "listForCourtRange"],
      input,
      this.toAppError,
    );

  mutCourtBlockUpdateRange = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["courtBlock", "updateRange"],
      input,
      this.toAppError,
    );

  mutCourtBlockCreateMaintenance = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["courtBlock", "createMaintenance"],
      input,
      this.toAppError,
    );

  mutCourtBlockCreateWalkIn = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["courtBlock", "createWalkIn"],
      input,
      this.toAppError,
    );

  mutCourtBlockCancel = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["courtBlock", "cancel"],
      input,
      this.toAppError,
    );

  queryReservationOwnerGetActiveForCourtRange = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["reservationOwner", "getActiveForCourtRange"],
      input,
      this.toAppError,
    );

  mutReservationOwnerCreateGuestBooking = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["reservationOwner", "createGuestBooking"],
      input,
      this.toAppError,
    );

  mutReservationOwnerConvertWalkInBlockToGuest = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["reservationOwner", "convertWalkInBlockToGuest"],
      input,
      this.toAppError,
    );

  queryGuestProfileList = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["guestProfile", "list"],
      input,
      this.toAppError,
    );

  mutGuestProfileCreate = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["guestProfile", "create"],
      input,
      this.toAppError,
    );

  queryClaimRequestGetMy = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["claimRequest", "getMy"],
      input,
      this.toAppError,
    );

  queryClaimRequestGetById = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["claimRequest", "getById"],
      input,
      this.toAppError,
    );

  mutClaimRequestSubmitClaim = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["claimRequest", "submitClaim"],
      input,
      this.toAppError,
    );

  queryPlaceList = async (input?: unknown) =>
    callTrpcQuery(this.clientApi, ["place", "list"], input, this.toAppError);

  queryPlaceGetById = async (input?: unknown) =>
    callTrpcQuery(this.clientApi, ["place", "getById"], input, this.toAppError);

  mutPlaceManagementDelete = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["placeManagement", "delete"],
      input,
      this.toAppError,
    );

  queryBookingsImportAiUsage = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["bookingsImport", "aiUsage"],
      input,
      this.toAppError,
    );

  queryBookingsImportGetJob = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["bookingsImport", "getJob"],
      input,
      this.toAppError,
    );

  queryBookingsImportListRows = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["bookingsImport", "listRows"],
      input,
      this.toAppError,
    );

  queryBookingsImportListSources = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["bookingsImport", "listSources"],
      input,
      this.toAppError,
    );

  mutBookingsImportCreateDraft = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["bookingsImport", "createDraft"],
      input,
      this.toAppError,
    );

  mutBookingsImportNormalize = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["bookingsImport", "normalize"],
      input,
      this.toAppError,
    );

  mutBookingsImportUpdateRow = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["bookingsImport", "updateRow"],
      input,
      this.toAppError,
    );

  mutBookingsImportDeleteRow = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["bookingsImport", "deleteRow"],
      input,
      this.toAppError,
    );

  mutBookingsImportDiscardJob = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["bookingsImport", "discardJob"],
      input,
      this.toAppError,
    );

  mutBookingsImportCommit = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["bookingsImport", "commit"],
      input,
      this.toAppError,
    );

  mutBookingsImportReplaceWithGuest = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["bookingsImport", "replaceWithGuest"],
      input,
      this.toAppError,
    );

  mutReservationOwnerConfirmPaidOffline = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["reservationOwner", "confirmPaidOffline"],
      input,
      this.toAppError,
    );

  queryAuditReservationHistory = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["audit", "reservationHistory"],
      input,
      this.toAppError,
    );
}

export const createOwnerApi = (deps: OwnerApiDeps = {}): IOwnerApi =>
  new OwnerApi(deps);

const OWNER_API_SINGLETON = createOwnerApi();

export const getOwnerApi = (): IOwnerApi => OWNER_API_SINGLETON;
