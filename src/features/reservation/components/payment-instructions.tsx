"use client";

import { Building2, Smartphone } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CopyButton } from "./copy-button";

interface PaymentInstructionsProps {
  gcashNumber?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
  paymentInstructions?: string | null;
}

interface PaymentMethodProps {
  icon: ReactNode;
  title: string;
  accountNumber?: string | null;
  accountName?: string | null;
}

function PaymentMethod({
  icon,
  title,
  accountNumber,
  accountName,
}: PaymentMethodProps) {
  if (!accountNumber) return null;

  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <span className="font-medium">{title}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm font-medium">{accountNumber}</span>
        <CopyButton value={accountNumber} ariaLabel={`Copy ${title} number`} />
      </div>
      {accountName && (
        <p className="text-sm text-muted-foreground">{accountName}</p>
      )}
    </div>
  );
}

export function PaymentInstructions({
  gcashNumber,
  bankName,
  bankAccountNumber,
  bankAccountName,
  paymentInstructions,
}: PaymentInstructionsProps) {
  const hasGcash = !!gcashNumber;
  const hasBank = !!bankAccountNumber;
  const hasCustom = !!paymentInstructions;

  if (!hasGcash && !hasBank && !hasCustom) {
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
              Pay via GCash, bank transfer, or cash
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
          {hasGcash && (
            <PaymentMethod
              icon={<Smartphone className="h-5 w-5 text-primary" />}
              title="GCash"
              accountNumber={gcashNumber}
              accountName={bankAccountName}
            />
          )}
          {hasBank && (
            <PaymentMethod
              icon={<Building2 className="h-5 w-5 text-primary" />}
              title={bankName || "Bank Transfer"}
              accountNumber={bankAccountNumber}
              accountName={bankAccountName}
            />
          )}
          {hasCustom && (
            <p className="text-sm text-muted-foreground">
              {paymentInstructions}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Or pay cash at the court before your reserved time.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
