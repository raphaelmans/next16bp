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

export interface IOwnerApi {
  mutCourtAddonSet: ProcedureFn<TrpcClientApi["courtAddon"]["set"]["mutate"]>;
  mutPlaceAddonSet: ProcedureFn<TrpcClientApi["placeAddon"]["set"]["mutate"]>;
  mutCourtHoursCopyFromCourt: ProcedureFn<
    TrpcClientApi["courtHours"]["copyFromCourt"]["mutate"]
  >;
  mutCourtHoursSet: ProcedureFn<TrpcClientApi["courtHours"]["set"]["mutate"]>;
  mutCourtManagementCreate: ProcedureFn<
    TrpcClientApi["courtManagement"]["create"]["mutate"]
  >;
  mutCourtManagementUpdate: ProcedureFn<
    TrpcClientApi["courtManagement"]["update"]["mutate"]
  >;
  mutCourtRateRuleCopyFromCourt: ProcedureFn<
    TrpcClientApi["courtRateRule"]["copyFromCourt"]["mutate"]
  >;
  mutCourtRateRuleSet: ProcedureFn<
    TrpcClientApi["courtRateRule"]["set"]["mutate"]
  >;
  mutOrganizationPaymentCreateMethod: ProcedureFn<
    TrpcClientApi["organizationPayment"]["createMethod"]["mutate"]
  >;
  mutOrganizationPaymentDeleteMethod: ProcedureFn<
    TrpcClientApi["organizationPayment"]["deleteMethod"]["mutate"]
  >;
  mutOrganizationPaymentSetDefault: ProcedureFn<
    TrpcClientApi["organizationPayment"]["setDefault"]["mutate"]
  >;
  mutOrganizationPaymentUpdateMethod: ProcedureFn<
    TrpcClientApi["organizationPayment"]["updateMethod"]["mutate"]
  >;
  mutOrganizationUpdate: ProcedureFn<
    TrpcClientApi["organization"]["update"]["mutate"]
  >;
  mutOrganizationUpdateProfile: ProcedureFn<
    TrpcClientApi["organization"]["updateProfile"]["mutate"]
  >;
  mutOrganizationUploadLogo: ProcedureFn<
    TrpcClientApi["organization"]["uploadLogo"]["mutate"]
  >;
  mutOrganizationMemberInvite: ProcedureFn<
    TrpcClientApi["organizationMember"]["invite"]["mutate"]
  >;
  mutOrganizationMemberUpdatePermissions: ProcedureFn<
    TrpcClientApi["organizationMember"]["updatePermissions"]["mutate"]
  >;
  mutOrganizationMemberRevokeMember: ProcedureFn<
    TrpcClientApi["organizationMember"]["revokeMember"]["mutate"]
  >;
  mutOrganizationMemberCancelInvitation: ProcedureFn<
    TrpcClientApi["organizationMember"]["cancelInvitation"]["mutate"]
  >;
  mutOrganizationMemberAcceptInvitation: ProcedureFn<
    TrpcClientApi["organizationMember"]["acceptInvitation"]["mutate"]
  >;
  mutOrganizationMemberDeclineInvitation: ProcedureFn<
    TrpcClientApi["organizationMember"]["declineInvitation"]["mutate"]
  >;
  mutOrganizationMemberSetMyReservationNotificationPreference: ProcedureFn<
    TrpcClientApi["organizationMember"]["setMyReservationNotificationPreference"]["mutate"]
  >;
  mutPlaceManagementCreate: ProcedureFn<
    TrpcClientApi["placeManagement"]["create"]["mutate"]
  >;
  mutPlaceManagementRemovePhoto: ProcedureFn<
    TrpcClientApi["placeManagement"]["removePhoto"]["mutate"]
  >;
  mutPlaceManagementReorderPhotos: ProcedureFn<
    TrpcClientApi["placeManagement"]["reorderPhotos"]["mutate"]
  >;
  mutPlaceManagementUpdate: ProcedureFn<
    TrpcClientApi["placeManagement"]["update"]["mutate"]
  >;
  mutPlaceManagementUploadPhoto: ProcedureFn<
    TrpcClientApi["placeManagement"]["uploadPhoto"]["mutate"]
  >;
  mutPlaceVerificationSubmit: ProcedureFn<
    TrpcClientApi["placeVerification"]["submit"]["mutate"]
  >;
  mutPlaceVerificationToggleReservations: ProcedureFn<
    TrpcClientApi["placeVerification"]["toggleReservations"]["mutate"]
  >;
  mutReservationOwnerAccept: ProcedureFn<
    TrpcClientApi["reservationOwner"]["accept"]["mutate"]
  >;
  mutReservationOwnerAcceptGroup: ProcedureFn<
    TrpcClientApi["reservationOwner"]["acceptGroup"]["mutate"]
  >;
  mutReservationOwnerConfirmPayment: ProcedureFn<
    TrpcClientApi["reservationOwner"]["confirmPayment"]["mutate"]
  >;
  mutReservationOwnerConfirmPaymentGroup: ProcedureFn<
    TrpcClientApi["reservationOwner"]["confirmPaymentGroup"]["mutate"]
  >;
  mutReservationOwnerReject: ProcedureFn<
    TrpcClientApi["reservationOwner"]["reject"]["mutate"]
  >;
  mutReservationOwnerRejectGroup: ProcedureFn<
    TrpcClientApi["reservationOwner"]["rejectGroup"]["mutate"]
  >;
  queryCourtAddonGet: ProcedureFn<TrpcClientApi["courtAddon"]["get"]["query"]>;
  queryPlaceAddonGet: ProcedureFn<TrpcClientApi["placeAddon"]["get"]["query"]>;
  queryCourtHoursGet: ProcedureFn<TrpcClientApi["courtHours"]["get"]["query"]>;
  queryCourtManagementGetById: ProcedureFn<
    TrpcClientApi["courtManagement"]["getById"]["query"]
  >;
  queryCourtManagementListByPlace: ProcedureFn<
    TrpcClientApi["courtManagement"]["listByPlace"]["query"]
  >;
  queryCourtRateRuleGet: ProcedureFn<
    TrpcClientApi["courtRateRule"]["get"]["query"]
  >;
  queryOrganizationGet: ProcedureFn<
    TrpcClientApi["organization"]["get"]["query"]
  >;
  queryOrganizationMy: ProcedureFn<
    TrpcClientApi["organization"]["my"]["query"]
  >;
  queryOrganizationMemberList: ProcedureFn<
    TrpcClientApi["organizationMember"]["list"]["query"]
  >;
  queryOrganizationMemberListInvitations: ProcedureFn<
    TrpcClientApi["organizationMember"]["listInvitations"]["query"]
  >;
  queryOrganizationMemberGetMyPermissions: ProcedureFn<
    TrpcClientApi["organizationMember"]["getMyPermissions"]["query"]
  >;
  queryOrganizationMemberGetMyReservationNotificationPreference: ProcedureFn<
    TrpcClientApi["organizationMember"]["getMyReservationNotificationPreference"]["query"]
  >;
  queryOrganizationMemberGetReservationNotificationRoutingStatus: ProcedureFn<
    TrpcClientApi["organizationMember"]["getReservationNotificationRoutingStatus"]["query"]
  >;
  queryOrganizationPaymentListMethods: ProcedureFn<
    TrpcClientApi["organizationPayment"]["listMethods"]["query"]
  >;
  queryOwnerSetupGetStatus: ProcedureFn<
    TrpcClientApi["ownerSetup"]["getStatus"]["query"]
  >;
  queryPlaceManagementGetById: ProcedureFn<
    TrpcClientApi["placeManagement"]["getById"]["query"]
  >;
  queryPlaceManagementList: ProcedureFn<
    TrpcClientApi["placeManagement"]["list"]["query"]
  >;
  queryPlaceVerificationGetByPlace: ProcedureFn<
    TrpcClientApi["placeVerification"]["getByPlace"]["query"]
  >;
  queryReservationOwnerGetForOrganization: ProcedureFn<
    TrpcClientApi["reservationOwner"]["getForOrganization"]["query"]
  >;
  queryReservationOwnerGetGroupDetail: ProcedureFn<
    TrpcClientApi["reservationOwner"]["getGroupDetail"]["query"]
  >;
  queryReservationOwnerGetPendingCount: ProcedureFn<
    TrpcClientApi["reservationOwner"]["getPendingCount"]["query"]
  >;
  querySportList: ProcedureFn<TrpcClientApi["sport"]["list"]["query"]>;
  queryCourtBlockListForCourtRange: ProcedureFn<
    TrpcClientApi["courtBlock"]["listForCourtRange"]["query"]
  >;
  mutCourtBlockUpdateRange: ProcedureFn<
    TrpcClientApi["courtBlock"]["updateRange"]["mutate"]
  >;
  mutCourtBlockCreateMaintenance: ProcedureFn<
    TrpcClientApi["courtBlock"]["createMaintenance"]["mutate"]
  >;
  mutCourtBlockCreateWalkIn: ProcedureFn<
    TrpcClientApi["courtBlock"]["createWalkIn"]["mutate"]
  >;
  mutCourtBlockCancel: ProcedureFn<
    TrpcClientApi["courtBlock"]["cancel"]["mutate"]
  >;
  queryReservationOwnerGetActiveForCourtRange: ProcedureFn<
    TrpcClientApi["reservationOwner"]["getActiveForCourtRange"]["query"]
  >;
  mutReservationOwnerCreateGuestBooking: ProcedureFn<
    TrpcClientApi["reservationOwner"]["createGuestBooking"]["mutate"]
  >;
  mutReservationOwnerConvertWalkInBlockToGuest: ProcedureFn<
    TrpcClientApi["reservationOwner"]["convertWalkInBlockToGuest"]["mutate"]
  >;
  queryGuestProfileList: ProcedureFn<
    TrpcClientApi["guestProfile"]["list"]["query"]
  >;
  mutGuestProfileCreate: ProcedureFn<
    TrpcClientApi["guestProfile"]["create"]["mutate"]
  >;
  queryClaimRequestGetMy: ProcedureFn<
    TrpcClientApi["claimRequest"]["getMy"]["query"]
  >;
  queryClaimRequestGetById: ProcedureFn<
    TrpcClientApi["claimRequest"]["getById"]["query"]
  >;
  mutClaimRequestSubmitClaim: ProcedureFn<
    TrpcClientApi["claimRequest"]["submitClaim"]["mutate"]
  >;
  queryPlaceList: ProcedureFn<TrpcClientApi["place"]["list"]["query"]>;
  queryPlaceGetById: ProcedureFn<TrpcClientApi["place"]["getById"]["query"]>;
  mutPlaceManagementDelete: ProcedureFn<
    TrpcClientApi["placeManagement"]["delete"]["mutate"]
  >;
  queryBookingsImportAiUsage: ProcedureFn<
    TrpcClientApi["bookingsImport"]["aiUsage"]["query"]
  >;
  queryBookingsImportGetJob: ProcedureFn<
    TrpcClientApi["bookingsImport"]["getJob"]["query"]
  >;
  queryBookingsImportListRows: ProcedureFn<
    TrpcClientApi["bookingsImport"]["listRows"]["query"]
  >;
  queryBookingsImportListSources: ProcedureFn<
    TrpcClientApi["bookingsImport"]["listSources"]["query"]
  >;
  mutBookingsImportCreateDraft: ProcedureFn<
    TrpcClientApi["bookingsImport"]["createDraft"]["mutate"]
  >;
  mutBookingsImportNormalize: ProcedureFn<
    TrpcClientApi["bookingsImport"]["normalize"]["mutate"]
  >;
  mutBookingsImportUpdateRow: ProcedureFn<
    TrpcClientApi["bookingsImport"]["updateRow"]["mutate"]
  >;
  mutBookingsImportDeleteRow: ProcedureFn<
    TrpcClientApi["bookingsImport"]["deleteRow"]["mutate"]
  >;
  mutBookingsImportDiscardJob: ProcedureFn<
    TrpcClientApi["bookingsImport"]["discardJob"]["mutate"]
  >;
  mutBookingsImportCommit: ProcedureFn<
    TrpcClientApi["bookingsImport"]["commit"]["mutate"]
  >;
  mutBookingsImportReplaceWithGuest: ProcedureFn<
    TrpcClientApi["bookingsImport"]["replaceWithGuest"]["mutate"]
  >;
  mutReservationOwnerConfirmPaidOffline: ProcedureFn<
    TrpcClientApi["reservationOwner"]["confirmPaidOffline"]["mutate"]
  >;
  queryAuditReservationHistory: ProcedureFn<
    TrpcClientApi["audit"]["reservationHistory"]["query"]
  >;
  queryAnalyticsGetRevenue: ProcedureFn<
    TrpcClientApi["analytics"]["getRevenue"]["query"]
  >;
  queryAnalyticsGetUtilization: ProcedureFn<
    TrpcClientApi["analytics"]["getUtilization"]["query"]
  >;
  queryAnalyticsGetOperations: ProcedureFn<
    TrpcClientApi["analytics"]["getOperations"]["query"]
  >;
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

  mutCourtHoursCopyFromCourt: ProcedureFn<
    TrpcClientApi["courtHours"]["copyFromCourt"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["courtHours", "copyFromCourt"],
      (clientApi) => clientApi.courtHours.copyFromCourt.mutate,
      input,
      this.toAppError,
    );

  mutCourtHoursSet: ProcedureFn<TrpcClientApi["courtHours"]["set"]["mutate"]> =
    async (input) =>
      callTrpcMutation(
        this.clientApi,
        ["courtHours", "set"],
        (clientApi) => clientApi.courtHours.set.mutate,
        input,
        this.toAppError,
      );

  mutCourtManagementCreate: ProcedureFn<
    TrpcClientApi["courtManagement"]["create"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["courtManagement", "create"],
      (clientApi) => clientApi.courtManagement.create.mutate,
      input,
      this.toAppError,
    );

  mutCourtManagementUpdate: ProcedureFn<
    TrpcClientApi["courtManagement"]["update"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["courtManagement", "update"],
      (clientApi) => clientApi.courtManagement.update.mutate,
      input,
      this.toAppError,
    );

  mutCourtRateRuleCopyFromCourt: ProcedureFn<
    TrpcClientApi["courtRateRule"]["copyFromCourt"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["courtRateRule", "copyFromCourt"],
      (clientApi) => clientApi.courtRateRule.copyFromCourt.mutate,
      input,
      this.toAppError,
    );

  mutCourtRateRuleSet: ProcedureFn<
    TrpcClientApi["courtRateRule"]["set"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["courtRateRule", "set"],
      (clientApi) => clientApi.courtRateRule.set.mutate,
      input,
      this.toAppError,
    );

  mutCourtAddonSet: ProcedureFn<TrpcClientApi["courtAddon"]["set"]["mutate"]> =
    async (input) =>
      callTrpcMutation(
        this.clientApi,
        ["courtAddon", "set"],
        (clientApi) => clientApi.courtAddon.set.mutate,
        input,
        this.toAppError,
      );

  mutPlaceAddonSet: ProcedureFn<TrpcClientApi["placeAddon"]["set"]["mutate"]> =
    async (input) =>
      callTrpcMutation(
        this.clientApi,
        ["placeAddon", "set"],
        (clientApi) => clientApi.placeAddon.set.mutate,
        input,
        this.toAppError,
      );

  mutOrganizationPaymentCreateMethod: ProcedureFn<
    TrpcClientApi["organizationPayment"]["createMethod"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["organizationPayment", "createMethod"],
      (clientApi) => clientApi.organizationPayment.createMethod.mutate,
      input,
      this.toAppError,
    );

  mutOrganizationPaymentDeleteMethod: ProcedureFn<
    TrpcClientApi["organizationPayment"]["deleteMethod"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["organizationPayment", "deleteMethod"],
      (clientApi) => clientApi.organizationPayment.deleteMethod.mutate,
      input,
      this.toAppError,
    );

  mutOrganizationPaymentSetDefault: ProcedureFn<
    TrpcClientApi["organizationPayment"]["setDefault"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["organizationPayment", "setDefault"],
      (clientApi) => clientApi.organizationPayment.setDefault.mutate,
      input,
      this.toAppError,
    );

  mutOrganizationPaymentUpdateMethod: ProcedureFn<
    TrpcClientApi["organizationPayment"]["updateMethod"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["organizationPayment", "updateMethod"],
      (clientApi) => clientApi.organizationPayment.updateMethod.mutate,
      input,
      this.toAppError,
    );

  mutOrganizationUpdate: ProcedureFn<
    TrpcClientApi["organization"]["update"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["organization", "update"],
      (clientApi) => clientApi.organization.update.mutate,
      input,
      this.toAppError,
    );

  mutOrganizationUpdateProfile: ProcedureFn<
    TrpcClientApi["organization"]["updateProfile"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["organization", "updateProfile"],
      (clientApi) => clientApi.organization.updateProfile.mutate,
      input,
      this.toAppError,
    );

  mutOrganizationUploadLogo: ProcedureFn<
    TrpcClientApi["organization"]["uploadLogo"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["organization", "uploadLogo"],
      (clientApi) => clientApi.organization.uploadLogo.mutate,
      input,
      this.toAppError,
    );

  mutOrganizationMemberInvite: ProcedureFn<
    TrpcClientApi["organizationMember"]["invite"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["organizationMember", "invite"],
      (clientApi) => clientApi.organizationMember.invite.mutate,
      input,
      this.toAppError,
    );

  mutOrganizationMemberUpdatePermissions: ProcedureFn<
    TrpcClientApi["organizationMember"]["updatePermissions"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["organizationMember", "updatePermissions"],
      (clientApi) => clientApi.organizationMember.updatePermissions.mutate,
      input,
      this.toAppError,
    );

  mutOrganizationMemberRevokeMember: ProcedureFn<
    TrpcClientApi["organizationMember"]["revokeMember"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["organizationMember", "revokeMember"],
      (clientApi) => clientApi.organizationMember.revokeMember.mutate,
      input,
      this.toAppError,
    );

  mutOrganizationMemberCancelInvitation: ProcedureFn<
    TrpcClientApi["organizationMember"]["cancelInvitation"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["organizationMember", "cancelInvitation"],
      (clientApi) => clientApi.organizationMember.cancelInvitation.mutate,
      input,
      this.toAppError,
    );

  mutOrganizationMemberAcceptInvitation: ProcedureFn<
    TrpcClientApi["organizationMember"]["acceptInvitation"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["organizationMember", "acceptInvitation"],
      (clientApi) => clientApi.organizationMember.acceptInvitation.mutate,
      input,
      this.toAppError,
    );

  mutOrganizationMemberDeclineInvitation: ProcedureFn<
    TrpcClientApi["organizationMember"]["declineInvitation"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["organizationMember", "declineInvitation"],
      (clientApi) => clientApi.organizationMember.declineInvitation.mutate,
      input,
      this.toAppError,
    );

  mutOrganizationMemberSetMyReservationNotificationPreference: ProcedureFn<
    TrpcClientApi["organizationMember"]["setMyReservationNotificationPreference"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["organizationMember", "setMyReservationNotificationPreference"],
      (clientApi) =>
        clientApi.organizationMember.setMyReservationNotificationPreference
          .mutate,
      input,
      this.toAppError,
    );

  mutPlaceManagementCreate: ProcedureFn<
    TrpcClientApi["placeManagement"]["create"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["placeManagement", "create"],
      (clientApi) => clientApi.placeManagement.create.mutate,
      input,
      this.toAppError,
    );

  mutPlaceManagementRemovePhoto: ProcedureFn<
    TrpcClientApi["placeManagement"]["removePhoto"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["placeManagement", "removePhoto"],
      (clientApi) => clientApi.placeManagement.removePhoto.mutate,
      input,
      this.toAppError,
    );

  mutPlaceManagementReorderPhotos: ProcedureFn<
    TrpcClientApi["placeManagement"]["reorderPhotos"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["placeManagement", "reorderPhotos"],
      (clientApi) => clientApi.placeManagement.reorderPhotos.mutate,
      input,
      this.toAppError,
    );

  mutPlaceManagementUpdate: ProcedureFn<
    TrpcClientApi["placeManagement"]["update"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["placeManagement", "update"],
      (clientApi) => clientApi.placeManagement.update.mutate,
      input,
      this.toAppError,
    );

  mutPlaceManagementUploadPhoto: ProcedureFn<
    TrpcClientApi["placeManagement"]["uploadPhoto"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["placeManagement", "uploadPhoto"],
      (clientApi) => clientApi.placeManagement.uploadPhoto.mutate,
      input,
      this.toAppError,
    );

  mutPlaceVerificationSubmit: ProcedureFn<
    TrpcClientApi["placeVerification"]["submit"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["placeVerification", "submit"],
      (clientApi) => clientApi.placeVerification.submit.mutate,
      input,
      this.toAppError,
    );

  mutPlaceVerificationToggleReservations: ProcedureFn<
    TrpcClientApi["placeVerification"]["toggleReservations"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["placeVerification", "toggleReservations"],
      (clientApi) => clientApi.placeVerification.toggleReservations.mutate,
      input,
      this.toAppError,
    );

  mutReservationOwnerAccept: ProcedureFn<
    TrpcClientApi["reservationOwner"]["accept"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["reservationOwner", "accept"],
      (clientApi) => clientApi.reservationOwner.accept.mutate,
      input,
      this.toAppError,
    );

  mutReservationOwnerAcceptGroup: ProcedureFn<
    TrpcClientApi["reservationOwner"]["acceptGroup"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["reservationOwner", "acceptGroup"],
      (clientApi) => clientApi.reservationOwner.acceptGroup.mutate,
      input,
      this.toAppError,
    );

  mutReservationOwnerConfirmPayment: ProcedureFn<
    TrpcClientApi["reservationOwner"]["confirmPayment"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["reservationOwner", "confirmPayment"],
      (clientApi) => clientApi.reservationOwner.confirmPayment.mutate,
      input,
      this.toAppError,
    );

  mutReservationOwnerConfirmPaymentGroup: ProcedureFn<
    TrpcClientApi["reservationOwner"]["confirmPaymentGroup"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["reservationOwner", "confirmPaymentGroup"],
      (clientApi) => clientApi.reservationOwner.confirmPaymentGroup.mutate,
      input,
      this.toAppError,
    );

  mutReservationOwnerReject: ProcedureFn<
    TrpcClientApi["reservationOwner"]["reject"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["reservationOwner", "reject"],
      (clientApi) => clientApi.reservationOwner.reject.mutate,
      input,
      this.toAppError,
    );

  mutReservationOwnerRejectGroup: ProcedureFn<
    TrpcClientApi["reservationOwner"]["rejectGroup"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["reservationOwner", "rejectGroup"],
      (clientApi) => clientApi.reservationOwner.rejectGroup.mutate,
      input,
      this.toAppError,
    );

  mutReservationOwnerCancel: ProcedureFn<
    TrpcClientApi["reservationOwner"]["cancel"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["reservationOwner", "cancel"],
      (clientApi) => clientApi.reservationOwner.cancel.mutate,
      input,
      this.toAppError,
    );

  mutReservationOwnerCancelGroup: ProcedureFn<
    TrpcClientApi["reservationOwner"]["cancelGroup"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["reservationOwner", "cancelGroup"],
      (clientApi) => clientApi.reservationOwner.cancelGroup.mutate,
      input,
      this.toAppError,
    );

  queryCourtHoursGet: ProcedureFn<TrpcClientApi["courtHours"]["get"]["query"]> =
    async (input) =>
      callTrpcQuery(
        this.clientApi,
        ["courtHours", "get"],
        (clientApi) => clientApi.courtHours.get.query,
        input,
        this.toAppError,
      );

  queryCourtAddonGet: ProcedureFn<TrpcClientApi["courtAddon"]["get"]["query"]> =
    async (input) =>
      callTrpcQuery(
        this.clientApi,
        ["courtAddon", "get"],
        (clientApi) => clientApi.courtAddon.get.query,
        input,
        this.toAppError,
      );

  queryPlaceAddonGet: ProcedureFn<TrpcClientApi["placeAddon"]["get"]["query"]> =
    async (input) =>
      callTrpcQuery(
        this.clientApi,
        ["placeAddon", "get"],
        (clientApi) => clientApi.placeAddon.get.query,
        input,
        this.toAppError,
      );

  queryCourtManagementGetById: ProcedureFn<
    TrpcClientApi["courtManagement"]["getById"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["courtManagement", "getById"],
      (clientApi) => clientApi.courtManagement.getById.query,
      input,
      this.toAppError,
    );

  queryCourtManagementListByPlace: ProcedureFn<
    TrpcClientApi["courtManagement"]["listByPlace"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["courtManagement", "listByPlace"],
      (clientApi) => clientApi.courtManagement.listByPlace.query,
      input,
      this.toAppError,
    );

  queryCourtRateRuleGet: ProcedureFn<
    TrpcClientApi["courtRateRule"]["get"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["courtRateRule", "get"],
      (clientApi) => clientApi.courtRateRule.get.query,
      input,
      this.toAppError,
    );

  queryOrganizationGet: ProcedureFn<
    TrpcClientApi["organization"]["get"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["organization", "get"],
      (clientApi) => clientApi.organization.get.query,
      input,
      this.toAppError,
    );

  queryOrganizationMy: ProcedureFn<
    TrpcClientApi["organization"]["my"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["organization", "my"],
      (clientApi) => clientApi.organization.my.query,
      input,
      this.toAppError,
    );

  queryOrganizationMemberList: ProcedureFn<
    TrpcClientApi["organizationMember"]["list"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["organizationMember", "list"],
      (clientApi) => clientApi.organizationMember.list.query,
      input,
      this.toAppError,
    );

  queryOrganizationMemberListInvitations: ProcedureFn<
    TrpcClientApi["organizationMember"]["listInvitations"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["organizationMember", "listInvitations"],
      (clientApi) => clientApi.organizationMember.listInvitations.query,
      input,
      this.toAppError,
    );

  queryOrganizationMemberGetMyPermissions: ProcedureFn<
    TrpcClientApi["organizationMember"]["getMyPermissions"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["organizationMember", "getMyPermissions"],
      (clientApi) => clientApi.organizationMember.getMyPermissions.query,
      input,
      this.toAppError,
    );

  queryOrganizationMemberGetMyReservationNotificationPreference: ProcedureFn<
    TrpcClientApi["organizationMember"]["getMyReservationNotificationPreference"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["organizationMember", "getMyReservationNotificationPreference"],
      (clientApi) =>
        clientApi.organizationMember.getMyReservationNotificationPreference
          .query,
      input,
      this.toAppError,
    );

  queryOrganizationMemberGetReservationNotificationRoutingStatus: ProcedureFn<
    TrpcClientApi["organizationMember"]["getReservationNotificationRoutingStatus"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["organizationMember", "getReservationNotificationRoutingStatus"],
      (clientApi) =>
        clientApi.organizationMember.getReservationNotificationRoutingStatus
          .query,
      input,
      this.toAppError,
    );

  queryOrganizationPaymentListMethods: ProcedureFn<
    TrpcClientApi["organizationPayment"]["listMethods"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["organizationPayment", "listMethods"],
      (clientApi) => clientApi.organizationPayment.listMethods.query,
      input,
      this.toAppError,
    );

  queryOwnerSetupGetStatus: ProcedureFn<
    TrpcClientApi["ownerSetup"]["getStatus"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["ownerSetup", "getStatus"],
      (clientApi) => clientApi.ownerSetup.getStatus.query,
      input,
      this.toAppError,
    );

  queryPlaceManagementGetById: ProcedureFn<
    TrpcClientApi["placeManagement"]["getById"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["placeManagement", "getById"],
      (clientApi) => clientApi.placeManagement.getById.query,
      input,
      this.toAppError,
    );

  queryPlaceManagementList: ProcedureFn<
    TrpcClientApi["placeManagement"]["list"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["placeManagement", "list"],
      (clientApi) => clientApi.placeManagement.list.query,
      input,
      this.toAppError,
    );

  queryPlaceVerificationGetByPlace: ProcedureFn<
    TrpcClientApi["placeVerification"]["getByPlace"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["placeVerification", "getByPlace"],
      (clientApi) => clientApi.placeVerification.getByPlace.query,
      input,
      this.toAppError,
    );

  queryReservationOwnerGetForOrganization: ProcedureFn<
    TrpcClientApi["reservationOwner"]["getForOrganization"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["reservationOwner", "getForOrganization"],
      (clientApi) => clientApi.reservationOwner.getForOrganization.query,
      input,
      this.toAppError,
    );

  queryReservationOwnerGetGroupDetail: ProcedureFn<
    TrpcClientApi["reservationOwner"]["getGroupDetail"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["reservationOwner", "getGroupDetail"],
      (clientApi) => clientApi.reservationOwner.getGroupDetail.query,
      input,
      this.toAppError,
    );

  queryReservationOwnerGetPendingCount: ProcedureFn<
    TrpcClientApi["reservationOwner"]["getPendingCount"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["reservationOwner", "getPendingCount"],
      (clientApi) => clientApi.reservationOwner.getPendingCount.query,
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

  queryCourtBlockListForCourtRange: ProcedureFn<
    TrpcClientApi["courtBlock"]["listForCourtRange"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["courtBlock", "listForCourtRange"],
      (clientApi) => clientApi.courtBlock.listForCourtRange.query,
      input,
      this.toAppError,
    );

  mutCourtBlockUpdateRange: ProcedureFn<
    TrpcClientApi["courtBlock"]["updateRange"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["courtBlock", "updateRange"],
      (clientApi) => clientApi.courtBlock.updateRange.mutate,
      input,
      this.toAppError,
    );

  mutCourtBlockCreateMaintenance: ProcedureFn<
    TrpcClientApi["courtBlock"]["createMaintenance"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["courtBlock", "createMaintenance"],
      (clientApi) => clientApi.courtBlock.createMaintenance.mutate,
      input,
      this.toAppError,
    );

  mutCourtBlockCreateWalkIn: ProcedureFn<
    TrpcClientApi["courtBlock"]["createWalkIn"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["courtBlock", "createWalkIn"],
      (clientApi) => clientApi.courtBlock.createWalkIn.mutate,
      input,
      this.toAppError,
    );

  mutCourtBlockCancel: ProcedureFn<
    TrpcClientApi["courtBlock"]["cancel"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["courtBlock", "cancel"],
      (clientApi) => clientApi.courtBlock.cancel.mutate,
      input,
      this.toAppError,
    );

  queryReservationOwnerGetActiveForCourtRange: ProcedureFn<
    TrpcClientApi["reservationOwner"]["getActiveForCourtRange"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["reservationOwner", "getActiveForCourtRange"],
      (clientApi) => clientApi.reservationOwner.getActiveForCourtRange.query,
      input,
      this.toAppError,
    );

  mutReservationOwnerCreateGuestBooking: ProcedureFn<
    TrpcClientApi["reservationOwner"]["createGuestBooking"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["reservationOwner", "createGuestBooking"],
      (clientApi) => clientApi.reservationOwner.createGuestBooking.mutate,
      input,
      this.toAppError,
    );

  mutReservationOwnerConvertWalkInBlockToGuest: ProcedureFn<
    TrpcClientApi["reservationOwner"]["convertWalkInBlockToGuest"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["reservationOwner", "convertWalkInBlockToGuest"],
      (clientApi) =>
        clientApi.reservationOwner.convertWalkInBlockToGuest.mutate,
      input,
      this.toAppError,
    );

  queryGuestProfileList: ProcedureFn<
    TrpcClientApi["guestProfile"]["list"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["guestProfile", "list"],
      (clientApi) => clientApi.guestProfile.list.query,
      input,
      this.toAppError,
    );

  mutGuestProfileCreate: ProcedureFn<
    TrpcClientApi["guestProfile"]["create"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["guestProfile", "create"],
      (clientApi) => clientApi.guestProfile.create.mutate,
      input,
      this.toAppError,
    );

  queryClaimRequestGetMy: ProcedureFn<
    TrpcClientApi["claimRequest"]["getMy"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["claimRequest", "getMy"],
      (clientApi) => clientApi.claimRequest.getMy.query,
      input,
      this.toAppError,
    );

  queryClaimRequestGetById: ProcedureFn<
    TrpcClientApi["claimRequest"]["getById"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["claimRequest", "getById"],
      (clientApi) => clientApi.claimRequest.getById.query,
      input,
      this.toAppError,
    );

  mutClaimRequestSubmitClaim: ProcedureFn<
    TrpcClientApi["claimRequest"]["submitClaim"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["claimRequest", "submitClaim"],
      (clientApi) => clientApi.claimRequest.submitClaim.mutate,
      input,
      this.toAppError,
    );

  queryPlaceList: ProcedureFn<TrpcClientApi["place"]["list"]["query"]> = async (
    input,
  ) =>
    callTrpcQuery(
      this.clientApi,
      ["place", "list"],
      (clientApi) => clientApi.place.list.query,
      input,
      this.toAppError,
    );

  queryPlaceGetById: ProcedureFn<TrpcClientApi["place"]["getById"]["query"]> =
    async (input) =>
      callTrpcQuery(
        this.clientApi,
        ["place", "getById"],
        (clientApi) => clientApi.place.getById.query,
        input,
        this.toAppError,
      );

  mutPlaceManagementDelete: ProcedureFn<
    TrpcClientApi["placeManagement"]["delete"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["placeManagement", "delete"],
      (clientApi) => clientApi.placeManagement.delete.mutate,
      input,
      this.toAppError,
    );

  queryBookingsImportAiUsage: ProcedureFn<
    TrpcClientApi["bookingsImport"]["aiUsage"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["bookingsImport", "aiUsage"],
      (clientApi) => clientApi.bookingsImport.aiUsage.query,
      input,
      this.toAppError,
    );

  queryBookingsImportGetJob: ProcedureFn<
    TrpcClientApi["bookingsImport"]["getJob"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["bookingsImport", "getJob"],
      (clientApi) => clientApi.bookingsImport.getJob.query,
      input,
      this.toAppError,
    );

  queryBookingsImportListRows: ProcedureFn<
    TrpcClientApi["bookingsImport"]["listRows"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["bookingsImport", "listRows"],
      (clientApi) => clientApi.bookingsImport.listRows.query,
      input,
      this.toAppError,
    );

  queryBookingsImportListSources: ProcedureFn<
    TrpcClientApi["bookingsImport"]["listSources"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["bookingsImport", "listSources"],
      (clientApi) => clientApi.bookingsImport.listSources.query,
      input,
      this.toAppError,
    );

  mutBookingsImportCreateDraft: ProcedureFn<
    TrpcClientApi["bookingsImport"]["createDraft"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["bookingsImport", "createDraft"],
      (clientApi) => clientApi.bookingsImport.createDraft.mutate,
      input,
      this.toAppError,
    );

  mutBookingsImportNormalize: ProcedureFn<
    TrpcClientApi["bookingsImport"]["normalize"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["bookingsImport", "normalize"],
      (clientApi) => clientApi.bookingsImport.normalize.mutate,
      input,
      this.toAppError,
    );

  mutBookingsImportUpdateRow: ProcedureFn<
    TrpcClientApi["bookingsImport"]["updateRow"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["bookingsImport", "updateRow"],
      (clientApi) => clientApi.bookingsImport.updateRow.mutate,
      input,
      this.toAppError,
    );

  mutBookingsImportDeleteRow: ProcedureFn<
    TrpcClientApi["bookingsImport"]["deleteRow"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["bookingsImport", "deleteRow"],
      (clientApi) => clientApi.bookingsImport.deleteRow.mutate,
      input,
      this.toAppError,
    );

  mutBookingsImportDiscardJob: ProcedureFn<
    TrpcClientApi["bookingsImport"]["discardJob"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["bookingsImport", "discardJob"],
      (clientApi) => clientApi.bookingsImport.discardJob.mutate,
      input,
      this.toAppError,
    );

  mutBookingsImportCommit: ProcedureFn<
    TrpcClientApi["bookingsImport"]["commit"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["bookingsImport", "commit"],
      (clientApi) => clientApi.bookingsImport.commit.mutate,
      input,
      this.toAppError,
    );

  mutBookingsImportReplaceWithGuest: ProcedureFn<
    TrpcClientApi["bookingsImport"]["replaceWithGuest"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["bookingsImport", "replaceWithGuest"],
      (clientApi) => clientApi.bookingsImport.replaceWithGuest.mutate,
      input,
      this.toAppError,
    );

  mutReservationOwnerConfirmPaidOffline: ProcedureFn<
    TrpcClientApi["reservationOwner"]["confirmPaidOffline"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["reservationOwner", "confirmPaidOffline"],
      (clientApi) => clientApi.reservationOwner.confirmPaidOffline.mutate,
      input,
      this.toAppError,
    );

  queryAuditReservationHistory: ProcedureFn<
    TrpcClientApi["audit"]["reservationHistory"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["audit", "reservationHistory"],
      (clientApi) => clientApi.audit.reservationHistory.query,
      input,
      this.toAppError,
    );

  queryAnalyticsGetRevenue: ProcedureFn<
    TrpcClientApi["analytics"]["getRevenue"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["analytics", "getRevenue"],
      (clientApi) => clientApi.analytics.getRevenue.query,
      input,
      this.toAppError,
    );

  queryAnalyticsGetUtilization: ProcedureFn<
    TrpcClientApi["analytics"]["getUtilization"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["analytics", "getUtilization"],
      (clientApi) => clientApi.analytics.getUtilization.query,
      input,
      this.toAppError,
    );

  queryAnalyticsGetOperations: ProcedureFn<
    TrpcClientApi["analytics"]["getOperations"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["analytics", "getOperations"],
      (clientApi) => clientApi.analytics.getOperations.query,
      input,
      this.toAppError,
    );
}

export const createOwnerApi = (deps: OwnerApiDeps = {}) => new OwnerApi(deps);

const OWNER_API_SINGLETON = createOwnerApi();

export const getOwnerApi = () => OWNER_API_SINGLETON;
