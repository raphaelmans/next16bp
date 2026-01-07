import { router } from "./trpc";
import { healthRouter } from "@/modules/health/health.router";
import { authRouter } from "@/modules/auth/auth.router";
import { courtRouter } from "@/modules/court/court.router";
import { courtManagementRouter } from "@/modules/court/court-management.router";
import { profileRouter } from "@/modules/profile/profile.router";
import { organizationRouter } from "@/modules/organization/organization.router";
import { paymentProofRouter } from "@/modules/payment-proof/payment-proof.router";
import { claimRequestRouter } from "@/modules/claim-request/claim-request.router";
import { claimAdminRouter } from "@/modules/claim-request/admin/claim-admin.router";
import { adminCourtRouter } from "@/modules/court/admin/admin-court.router";
import { auditRouter } from "@/modules/audit/audit.router";
import { timeSlotRouter } from "@/modules/time-slot/time-slot.router";
import { reservationRouter } from "@/modules/reservation/reservation.router";
import { reservationOwnerRouter } from "@/modules/reservation/reservation-owner.router";

/**
 * Root router combining all module routers.
 */
export const appRouter = router({
  health: healthRouter,
  auth: authRouter,
  court: courtRouter,
  courtManagement: courtManagementRouter,
  profile: profileRouter,
  organization: organizationRouter,
  paymentProof: paymentProofRouter,
  claimRequest: claimRequestRouter,
  audit: auditRouter,
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
