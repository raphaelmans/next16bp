import { auditRouter } from "@/modules/audit/audit.router";
import { authRouter } from "@/modules/auth/auth.router";
import { availabilityRouter } from "@/modules/availability/availability.router";
import { claimAdminRouter } from "@/modules/claim-request/admin/claim-admin.router";
import { claimRequestRouter } from "@/modules/claim-request/claim-request.router";
import { adminCourtRouter } from "@/modules/court/admin/admin-court.router";
import { courtRouter } from "@/modules/court/court.router";
import { courtManagementRouter } from "@/modules/court/court-management.router";
import { courtHoursRouter } from "@/modules/court-hours/court-hours.router";
import { courtRateRuleRouter } from "@/modules/court-rate-rule/court-rate-rule.router";
import { healthRouter } from "@/modules/health/health.router";
import { organizationRouter } from "@/modules/organization/organization.router";
import { organizationPaymentRouter } from "@/modules/organization-payment/organization-payment.router";
import { paymentProofRouter } from "@/modules/payment-proof/payment-proof.router";
import { placeRouter } from "@/modules/place/place.router";
import { placeManagementRouter } from "@/modules/place/place-management.router";
import { profileRouter } from "@/modules/profile/profile.router";
import { reservationRouter } from "@/modules/reservation/reservation.router";
import { reservationOwnerRouter } from "@/modules/reservation/reservation-owner.router";
import { sportRouter } from "@/modules/sport/sport.router";
import { timeSlotRouter } from "@/modules/time-slot/time-slot.router";
import { router } from "./trpc";

/**
 * Root router combining all module routers.
 */
export const appRouter = router({
  health: healthRouter,
  auth: authRouter,
  court: courtRouter,
  courtManagement: courtManagementRouter,
  courtHours: courtHoursRouter,
  courtRateRule: courtRateRuleRouter,
  place: placeRouter,
  placeManagement: placeManagementRouter,
  sport: sportRouter,
  profile: profileRouter,
  organization: organizationRouter,
  organizationPayment: organizationPaymentRouter,
  paymentProof: paymentProofRouter,
  claimRequest: claimRequestRouter,
  audit: auditRouter,
  availability: availabilityRouter,
  timeSlot: timeSlotRouter,
  reservation: reservationRouter,
  reservationOwner: reservationOwnerRouter,
  admin: router({
    claim: claimAdminRouter,
    court: adminCourtRouter,
  }),
});

/**
 * Type export for client-side usage.
 * This is used to infer the types for the tRPC client.
 */
export type AppRouter = typeof appRouter;
