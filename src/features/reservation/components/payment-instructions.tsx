"use client";

import { Card, CardContent } from "@/components/ui/card";
import type {
  PaymentMethodProvider,
  PaymentMethodType,
} from "@/shared/lib/payment-methods";
import { PaymentMethodCard } from "./payment-method-card";

interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  provider: PaymentMethodProvider;
  accountNumber: string;
  accountName: string;
  instructions?: string | null;
  isDefault?: boolean;
}

interface PaymentInstructionsProps {
  methods?: PaymentMethod[];
}

export function PaymentInstructions({
  methods = [],
}: PaymentInstructionsProps) {
  if (methods.length === 0) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="p-6">
          <h3 className="mb-3 font-heading text-base font-semibold">
            How to Pay
          </h3>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="font-medium text-foreground">1.</span>
              Contact the court owner for payment details
            </li>
            <li className="flex gap-2">
              <span className="font-medium text-foreground">2.</span>
              Pay via mobile wallet or bank transfer
            </li>
            <li className="flex gap-2">
              <span className="font-medium text-foreground">3.</span>
              Fill out the proof form below
            </li>
            <li className="flex gap-2">
              <span className="font-medium text-foreground">4.</span>
              Click "I Have Paid" and wait for confirmation
            </li>
          </ol>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-muted/30">
      <CardContent className="p-6">
        <h3 className="mb-4 font-heading text-base font-semibold">
          How to Pay
        </h3>
        <div className="space-y-4">
          {methods.map((method) => (
            <div key={method.id} className="space-y-2">
              <PaymentMethodCard
                type={method.type}
                provider={method.provider}
                accountName={method.accountName}
                accountNumber={method.accountNumber}
                isDefault={method.isDefault}
              />
              {method.instructions && (
                <p className="text-sm text-muted-foreground">
                  {method.instructions}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
