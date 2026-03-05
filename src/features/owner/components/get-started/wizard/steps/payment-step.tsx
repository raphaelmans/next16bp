"use client";

import { CheckCircle2, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PaymentMethodsManager } from "@/features/owner/components/payment-methods-manager";
import type { SetupStatus } from "../../get-started-types";

interface PaymentStepProps {
  status: SetupStatus;
  isTransitioning?: boolean;
  onStepComplete: () => void;
}

export function PaymentStep({ status, onStepComplete }: PaymentStepProps) {
  if (status.hasPaymentMethod) {
    return (
      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CreditCard className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-medium">Payment method added</p>
            <p className="text-sm text-muted-foreground">
              You can manage payment methods from your settings page.
            </p>
          </div>
          <CheckCircle2 className="h-5 w-5 text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!status.organizationId) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            Create an organization first to add payment methods.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <PaymentMethodsManager
      organizationId={status.organizationId}
      onMethodChanged={onStepComplete}
    />
  );
}
