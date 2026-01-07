"use client";

import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface PaymentDisclaimerProps {
  className?: string;
}

export function PaymentDisclaimer({ className }: PaymentDisclaimerProps) {
  return (
    <Alert
      variant="destructive"
      className={cn(
        "bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-200 [&>svg]:text-amber-600",
        className,
      )}
    >
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Payment Disclaimer</AlertTitle>
      <AlertDescription className="text-amber-700 dark:text-amber-300">
        <strong>KudosCourts does not process payments.</strong> All payments are
        made directly between you and the court owner via GCash or bank
        transfer. We are not responsible for any payment disputes or issues.
        Please ensure you verify the payment details before transferring funds.
      </AlertDescription>
    </Alert>
  );
}
