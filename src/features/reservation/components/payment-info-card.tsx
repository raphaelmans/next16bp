"use client";

import { Building2, Check, Clock, Copy, Smartphone } from "lucide-react";
import { useState } from "react";
import {
  PAYMENT_PROVIDER_LABELS,
  type PaymentMethodProvider,
  type PaymentMethodType,
} from "@/common/payment-methods";
import { toast } from "@/common/toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  provider: PaymentMethodProvider;
  accountName: string;
  accountNumber: string;
  instructions?: string | null;
  isDefault?: boolean;
}

interface PaymentInfoCardProps {
  paymentMethods?: PaymentMethod[];
  expiresInMinutes?: number;
  className?: string;
}

export function PaymentInfoCard({
  paymentMethods = [],
  expiresInMinutes = 15,
  className,
}: PaymentInfoCardProps) {
  const hasMethods = paymentMethods.length > 0;

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
            {paymentMethods.map((method) => (
              <PaymentMethodItem key={method.id} method={method} />
            ))}
          </div>
        ) : (
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>Contact the court owner for payment details.</p>
            <p>Pay via mobile wallet or bank transfer.</p>
            <p>Share your payment proof below.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PaymentMethodItem({ method }: { method: PaymentMethod }) {
  const [copied, setCopied] = useState(false);
  const label = PAYMENT_PROVIDER_LABELS[method.provider];
  const Icon = method.type === "MOBILE_WALLET" ? Smartphone : Building2;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(method.accountNumber);
    setCopied(true);
    toast.success("Account number copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <span className="font-medium">{label}</span>
          {method.isDefault && <Badge variant="secondary">Recommended</Badge>}
        </div>
      </div>
      <div className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <p className="text-muted-foreground">Account Name</p>
          <p className="font-medium">{method.accountName}</p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
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
      {method.instructions && (
        <p className="text-sm text-muted-foreground">{method.instructions}</p>
      )}
    </div>
  );
}
