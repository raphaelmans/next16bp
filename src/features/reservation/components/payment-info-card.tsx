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

interface PaymentInfoCardProps {
  paymentMethods: PaymentMethod[];
  expiresInMinutes?: number;
  className?: string;
}

export function PaymentInfoCard({
  paymentMethods,
  expiresInMinutes = 15,
  className,
}: PaymentInfoCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Payment Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Owner acceptance is required. Once accepted, complete payment within
            {expiresInMinutes} minutes to secure your reservation.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {paymentMethods.map((method, index) => (
            <PaymentMethodItem
              key={`${method.type}-${index}`}
              method={method}
            />
          ))}
        </div>
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
