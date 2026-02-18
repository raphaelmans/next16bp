"use client";

import { appRoutes } from "@/common/app-routes";
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

  if (
    !organizationId ||
    isLoading ||
    paymentMethodsQuery.isLoading ||
    paymentMethodsQuery.isError ||
    paymentMethods.length > 0
  ) {
    return null;
  }

  return (
    <PaymentMethodReminderCard
      title="Payment methods missing"
      description="Add a payment method to receive payments when reservations are approved."
      actionLabel="Manage payment methods"
      actionHref={`${appRoutes.owner.settings}${SETTINGS_SECTION_HASHES.paymentMethods}`}
    />
  );
}
