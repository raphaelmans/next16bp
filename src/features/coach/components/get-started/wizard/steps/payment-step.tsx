"use client";

import { CheckCircle2, CreditCard } from "lucide-react";
import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CoachPaymentMethodsManager } from "@/features/coach/components/coach-payment-methods-manager";

interface PaymentStepProps {
  isComplete: boolean;
  coachId: string | null;
}

export function PaymentStep({ isComplete, coachId }: PaymentStepProps) {
  if (isComplete && coachId) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CreditCard className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-medium">Payment method added</p>
            <p className="text-sm text-muted-foreground">
              Players can now see your payment instructions for paid coach
              reservations.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <Button asChild variant="outline">
              <Link href={appRoutes.coach.paymentMethods}>
                Manage payment methods
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!coachId) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            Create your coach profile first to add payment methods.
          </p>
        </CardContent>
      </Card>
    );
  }

  return <CoachPaymentMethodsManager coachId={coachId} />;
}
