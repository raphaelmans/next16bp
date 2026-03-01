"use client";

import { appRoutes } from "@/common/app-routes";
import { getReservationEnablement } from "@/common/reservation-enablement";
import { SETTINGS_SECTION_HASHES } from "@/common/section-hashes";
import {
  useQueryOrganizationPaymentMethods,
  useQueryOwnerOrganization,
} from "@/features/owner/hooks";
import { PaymentMethodReminderCard } from "./payment-method-reminder-card";

export function OwnerPaymentMethodReminder() {
  const { organizationId, isLoading } = useQueryOwnerOrganization();
  const paymentMethodsQuery = useQueryOrganizationPaymentMethods(
    organizationId ?? undefined,
  );
  const paymentMethods = paymentMethodsQuery.data?.methods ?? [];
  const hasPaymentMethods = paymentMethods.some((method) => method.isActive);
  const hasMissingPaymentMethodIssue = getReservationEnablement({
    placeType: "RESERVABLE",
    verificationStatus: "VERIFIED",
    reservationsEnabled: true,
    hasPaymentMethods,
  }).issues.some((issue) => issue.code === "NO_PAYMENT_METHOD");

  if (
    !organizationId ||
    isLoading ||
    paymentMethodsQuery.isLoading ||
    paymentMethodsQuery.isError ||
    !hasMissingPaymentMethodIssue
  ) {
    return null;
  }

  return (
    <PaymentMethodReminderCard
      title="Payment methods missing"
      description="Add a payment method to receive payments when reservations are approved."
      actionLabel="Manage payment methods"
      actionHref={`${appRoutes.organization.settings}${SETTINGS_SECTION_HASHES.paymentMethods}`}
    />
  );
}
