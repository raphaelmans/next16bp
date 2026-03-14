import { analyticsRouter } from "@/lib/modules/analytics/analytics.router";
import { auditRouter } from "@/lib/modules/audit/audit.router";
import { authRouter } from "@/lib/modules/auth/auth.router";
import { availabilityRouter } from "@/lib/modules/availability/availability.router";
import { bookingsImportRouter } from "@/lib/modules/bookings-import/bookings-import.router";
import { chatRouter } from "@/lib/modules/chat/chat.router";
import { chatInboxRouter } from "@/lib/modules/chat/chat-inbox.router";
import { chatMessageRouter } from "@/lib/modules/chat/chat-message.router";
import { chatPocRouter } from "@/lib/modules/chat/chat-poc.router";
import { openPlayChatRouter } from "@/lib/modules/chat/open-play-chat.router";
import { reservationChatRouter } from "@/lib/modules/chat/reservation-chat.router";
import { claimAdminRouter } from "@/lib/modules/claim-request/admin/claim-admin.router";
import { claimRequestRouter } from "@/lib/modules/claim-request/claim-request.router";
import { coachRouter } from "@/lib/modules/coach/coach.router";
import { coachAddonRouter } from "@/lib/modules/coach-addon/coach-addon.router";
import { coachBlockRouter } from "@/lib/modules/coach-block/coach-block.router";
import { coachHoursRouter } from "@/lib/modules/coach-hours/coach-hours.router";
import { coachRateRuleRouter } from "@/lib/modules/coach-rate-rule/coach-rate-rule.router";
import { contactRouter } from "@/lib/modules/contact/contact.router";
import { adminCourtRouter } from "@/lib/modules/court/admin/admin-court.router";
import { courtRouter } from "@/lib/modules/court/court.router";
import { courtManagementRouter } from "@/lib/modules/court/court-management.router";
import { courtAddonRouter } from "@/lib/modules/court-addon/court-addon.router";
import { courtBlockRouter } from "@/lib/modules/court-block/court-block.router";
import { courtHoursRouter } from "@/lib/modules/court-hours/court-hours.router";
import { courtRateRuleRouter } from "@/lib/modules/court-rate-rule/court-rate-rule.router";
import { adminSubmissionRouter } from "@/lib/modules/court-submission/admin/admin-submission.router";
import { courtSubmissionRouter } from "@/lib/modules/court-submission/court-submission.router";
import { guestProfileRouter } from "@/lib/modules/guest-profile/guest-profile.router";
import { healthRouter } from "@/lib/modules/health/health.router";
import { notificationDeliveryAdminRouter } from "@/lib/modules/notification-delivery/admin/notification-delivery-admin.router";
import { openPlayRouter } from "@/lib/modules/open-play/open-play.router";
import { organizationAdminRouter } from "@/lib/modules/organization/admin/organization-admin.router";
import { organizationRouter } from "@/lib/modules/organization/organization.router";
import { organizationMemberRouter } from "@/lib/modules/organization-member/organization-member.router";
import { organizationPaymentRouter } from "@/lib/modules/organization-payment/organization-payment.router";
import { ownerSetupRouter } from "@/lib/modules/owner-setup/owner-setup.router";
import { paymentProofRouter } from "@/lib/modules/payment-proof/payment-proof.router";
import { placeRouter } from "@/lib/modules/place/place.router";
import { placeManagementRouter } from "@/lib/modules/place/place-management.router";
import { placeAddonRouter } from "@/lib/modules/place-addon/place-addon.router";
import { placeBookmarkRouter } from "@/lib/modules/place-bookmark/place-bookmark.router";
import { placeReviewAdminRouter } from "@/lib/modules/place-review/admin/place-review-admin.router";
import { placeReviewRouter } from "@/lib/modules/place-review/place-review.router";
import { placeVerificationAdminRouter } from "@/lib/modules/place-verification/admin/place-verification-admin.router";
import { placeVerificationRouter } from "@/lib/modules/place-verification/place-verification.router";
import { profileRouter } from "@/lib/modules/profile/profile.router";
import { pushSubscriptionRouter } from "@/lib/modules/push-subscription/push-subscription.router";
import { reservationRouter } from "@/lib/modules/reservation/reservation.router";
import { reservationOwnerRouter } from "@/lib/modules/reservation/reservation-owner.router";
import { sportRouter } from "@/lib/modules/sport/sport.router";
import { userNotificationRouter } from "@/lib/modules/user-notification/user-notification.router";
import { userPreferenceRouter } from "@/lib/modules/user-preference/user-preference.router";
import { router } from "./trpc";

/**
 * Root router combining all module routers.
 */
export const appRouter = router({
  analytics: analyticsRouter,
  health: healthRouter,
  auth: authRouter,
  court: courtRouter,
  courtManagement: courtManagementRouter,
  courtSubmission: courtSubmissionRouter,
  courtAddon: courtAddonRouter,
  courtBlock: courtBlockRouter,
  guestProfile: guestProfileRouter,
  courtHours: courtHoursRouter,
  courtRateRule: courtRateRuleRouter,
  place: placeRouter,
  placeAddon: placeAddonRouter,
  placeBookmark: placeBookmarkRouter,
  placeManagement: placeManagementRouter,
  placeReview: placeReviewRouter,
  placeVerification: placeVerificationRouter,
  sport: sportRouter,
  profile: profileRouter,
  organization: organizationRouter,
  organizationMember: organizationMemberRouter,
  organizationPayment: organizationPaymentRouter,
  ownerSetup: ownerSetupRouter,
  paymentProof: paymentProofRouter,
  claimRequest: claimRequestRouter,
  coach: coachRouter,
  coachAddon: coachAddonRouter,
  coachBlock: coachBlockRouter,
  coachHours: coachHoursRouter,
  coachRateRule: coachRateRuleRouter,
  chat: chatRouter,
  chatInbox: chatInboxRouter,
  chatMessage: chatMessageRouter,
  chatPoc: chatPocRouter,
  reservationChat: reservationChatRouter,
  openPlayChat: openPlayChatRouter,
  contact: contactRouter,
  audit: auditRouter,
  availability: availabilityRouter,
  bookingsImport: bookingsImportRouter,
  reservation: reservationRouter,
  reservationOwner: reservationOwnerRouter,
  openPlay: openPlayRouter,
  pushSubscription: pushSubscriptionRouter,
  userNotification: userNotificationRouter,
  userPreference: userPreferenceRouter,
  admin: router({
    claim: claimAdminRouter,
    court: adminCourtRouter,
    organization: organizationAdminRouter,
    placeVerification: placeVerificationAdminRouter,
    notificationDelivery: notificationDeliveryAdminRouter,
    courtSubmission: adminSubmissionRouter,
    placeReview: placeReviewAdminRouter,
  }),
});

/**
 * Type export for client-side usage.
 * This is used to infer the types for the tRPC client.
 */
export type AppRouter = typeof appRouter;
