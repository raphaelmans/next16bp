"use client";

import { Check, Clock, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PaymentMethod {
  type: "gcash" | "bank";
  accountName: string;
  accountNumber: string;
  bankName?: string;
}

interface PaymentDetails {
  gcashNumber?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
  paymentInstructions?: string | null;
}

interface PaymentInfoCardProps {
  paymentMethods?: PaymentMethod[];
  paymentDetails?: PaymentDetails | null;
  expiresInMinutes?: number;
  className?: string;
}

export function PaymentInfoCard({
  paymentMethods,
  paymentDetails,
  expiresInMinutes = 15,
  className,
}: PaymentInfoCardProps) {
  const derivedMethods: PaymentMethod[] = [];

  if (paymentDetails?.gcashNumber) {
    derivedMethods.push({
      type: "gcash",
      accountName: paymentDetails.bankAccountName ?? "GCash",
      accountNumber: paymentDetails.gcashNumber,
    });
  }

  if (paymentDetails?.bankAccountNumber) {
    derivedMethods.push({
      type: "bank",
      accountName: paymentDetails.bankAccountName ?? "Bank Transfer",
      accountNumber: paymentDetails.bankAccountNumber,
      bankName: paymentDetails.bankName ?? "Bank Transfer",
    });
  }

  const methodsToRender = paymentMethods ?? derivedMethods;
  const hasMethods = methodsToRender.length > 0;
  const hasInstructions = !!paymentDetails?.paymentInstructions;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Payment Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Owner acceptance is required. Once accepted, complete payment within{" "}
            {expiresInMinutes} minutes to secure your reservation.
          </AlertDescription>
        </Alert>

        {hasMethods ? (
          <div className="space-y-4">
            {methodsToRender.map((method, index) => (
              <PaymentMethodItem
                key={`${method.type}-${index}`}
                method={method}
              />
            ))}
            {hasInstructions && (
              <p className="text-sm text-muted-foreground">
                {paymentDetails?.paymentInstructions}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Or pay cash at the court before your reserved time.
            </p>
          </div>
        ) : (
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>Contact the court owner for payment details.</p>
            <p>Pay via GCash, bank transfer, or cash.</p>
            <p>Share your payment proof below.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PaymentMethodItem({ method }: { method: PaymentMethod }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(method.accountNumber);
    setCopied(true);
    toast.success("Account number copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium capitalize">
          {method.type === "gcash"
            ? "GCash"
            : method.bankName || "Bank Transfer"}
        </span>
        {method.type === "gcash" && (
          <span className="text-xs bg-[#007DFE]/10 text-[#007DFE] px-2 py-0.5 rounded-full">
            GCash
          </span>
        )}
      </div>
      <div className="space-y-1 text-sm">
        <p className="text-muted-foreground">Account Name</p>
        <p className="font-medium">{method.accountName}</p>
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="text-sm">
          <p className="text-muted-foreground">Account Number</p>
          <p className="font-mono font-medium">{method.accountNumber}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          {copied ? (
            <Check className="h-4 w-4 text-success" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
