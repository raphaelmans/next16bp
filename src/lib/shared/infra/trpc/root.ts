import { auditRouter } from "@/lib/modules/audit/audit.router";
import { authRouter } from "@/lib/modules/auth/auth.router";
import { availabilityRouter } from "@/lib/modules/availability/availability.router";
import { bookingsImportRouter } from "@/lib/modules/bookings-import/bookings-import.router";
import { chatRouter } from "@/lib/modules/chat/chat.router";
import { chatInboxRouter } from "@/lib/modules/chat/chat-inbox.router";
import { chatPocRouter } from "@/lib/modules/chat/chat-poc.router";
import { openPlayChatRouter } from "@/lib/modules/chat/open-play-chat.router";
import { reservationChatRouter } from "@/lib/modules/chat/reservation-chat.router";
import { supportChatRouter } from "@/lib/modules/chat/support-chat.router";
import { claimAdminRouter } from "@/lib/modules/claim-request/admin/claim-admin.router";
import { claimRequestRouter } from "@/lib/modules/claim-request/claim-request.router";
import { contactRouter } from "@/lib/modules/contact/contact.router";
import { adminCourtRouter } from "@/lib/modules/court/admin/admin-court.router";
import { courtRouter } from "@/lib/modules/court/court.router";
import { courtManagementRouter } from "@/lib/modules/court/court-management.router";
import { courtBlockRouter } from "@/lib/modules/court-block/court-block.router";
import { courtHoursRouter } from "@/lib/modules/court-hours/court-hours.router";
import { courtRateRuleRouter } from "@/lib/modules/court-rate-rule/court-rate-rule.router";
import { guestProfileRouter } from "@/lib/modules/guest-profile/guest-profile.router";
import { healthRouter } from "@/lib/modules/health/health.router";
import { notificationDeliveryAdminRouter } from "@/lib/modules/notification-delivery/admin/notification-delivery-admin.router";
import { openPlayRouter } from "@/lib/modules/open-play/open-play.router";
import { organizationAdminRouter } from "@/lib/modules/organization/admin/organization-admin.router";
import { organizationRouter } from "@/lib/modules/organization/organization.router";
import { organizationPaymentRouter } from "@/lib/modules/organization-payment/organization-payment.router";
import { ownerSetupRouter } from "@/lib/modules/owner-setup/owner-setup.router";
import { paymentProofRouter } from "@/lib/modules/payment-proof/payment-proof.router";
import { placeRouter } from "@/lib/modules/place/place.router";
import { placeManagementRouter } from "@/lib/modules/place/place-management.router";
import { placeVerificationAdminRouter } from "@/lib/modules/place-verification/admin/place-verification-admin.router";
import { placeVerificationRouter } from "@/lib/modules/place-verification/place-verification.router";
import { profileRouter } from "@/lib/modules/profile/profile.router";
import { pushSubscriptionRouter } from "@/lib/modules/push-subscription/push-subscription.router";
import { reservationRouter } from "@/lib/modules/reservation/reservation.router";
import { reservationOwnerRouter } from "@/lib/modules/reservation/reservation-owner.router";
import { sportRouter } from "@/lib/modules/sport/sport.router";
import { userPreferenceRouter } from "@/lib/modules/user-preference/user-preference.router";
import { router } from "./trpc";

/**
 * Root router combining all module routers.
 */
export const appRouter = router({
  health: healthRouter,
  auth: authRouter,
  court: courtRouter,
  courtManagement: courtManagementRouter,
  courtBlock: courtBlockRouter,
  guestProfile: guestProfileRouter,
  courtHours: courtHoursRouter,
  courtRateRule: courtRateRuleRouter,
  place: placeRouter,
  placeManagement: placeManagementRouter,
  placeVerification: placeVerificationRouter,
  sport: sportRouter,
  profile: profileRouter,
  organization: organizationRouter,
  organizationPayment: organizationPaymentRouter,
  ownerSetup: ownerSetupRouter,
  paymentProof: paymentProofRouter,
  claimRequest: claimRequestRouter,
  chat: chatRouter,
  chatInbox: chatInboxRouter,
  chatPoc: chatPocRouter,
  reservationChat: reservationChatRouter,
  openPlayChat: openPlayChatRouter,
  supportChat: supportChatRouter,
  contact: contactRouter,
  audit: auditRouter,
  availability: availabilityRouter,
  bookingsImport: bookingsImportRouter,
  reservation: reservationRouter,
  reservationOwner: reservationOwnerRouter,
  openPlay: openPlayRouter,
  pushSubscription: pushSubscriptionRouter,
  userPreference: userPreferenceRouter,
  admin: router({
    claim: claimAdminRouter,
    court: adminCourtRouter,
    organization: organizationAdminRouter,
    placeVerification: placeVerificationAdminRouter,
    notificationDelivery: notificationDeliveryAdminRouter,
  }),
});

/**
 * Type export for client-side usage.
 * This is used to infer the types for the tRPC client.
 */
export type AppRouter = typeof appRouter;
