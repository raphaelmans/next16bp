"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatPricingWarningMessage } from "../helpers";

type PricingWarningsAlertProps = {
  warnings: string[];
};

export function PricingWarningsAlert({ warnings }: PricingWarningsAlertProps) {
  if (warnings.length === 0) {
    return null;
  }

  return (
    <Alert>
      <AlertTitle>Pricing note</AlertTitle>
      <AlertDescription>
        <ul className="list-disc space-y-1 pl-4 text-sm">
          {warnings.map((warning) => (
            <li key={warning}>{formatPricingWarningMessage(warning)}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
