"use client";

import { Building2, Check, Copy, Smartphone, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  PAYMENT_PROVIDER_LABELS,
  type PaymentMethodProvider,
  type PaymentMethodType,
} from "@/shared/lib/payment-methods";

interface PaymentMethodCardProps {
  type: PaymentMethodType;
  provider: PaymentMethodProvider;
  accountName: string;
  accountNumber: string;
  isDefault?: boolean;
  className?: string;
}

export function PaymentMethodCard({
  type,
  provider,
  accountName,
  accountNumber,
  isDefault,
  className,
}: PaymentMethodCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(accountNumber);
    setCopied(true);
    toast.success("Account number copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const Icon = type === "MOBILE_WALLET" ? Smartphone : Building2;

  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-colors hover:border-primary/50",
        className,
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "h-12 w-12 rounded-lg flex items-center justify-center",
            type === "MOBILE_WALLET" ? "bg-primary/10" : "bg-muted",
          )}
        >
          <Icon className="h-6 w-6 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">{PAYMENT_PROVIDER_LABELS[provider]}</h4>
            {isDefault && (
              <span className="text-[10px] font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                <Star className="h-3 w-3" />
                RECOMMENDED
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{accountName}</p>
          <div className="flex items-center gap-2 mt-2">
            <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
              {accountNumber}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
