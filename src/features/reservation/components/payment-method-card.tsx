"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PaymentMethodCardProps {
  type: "gcash" | "bank";
  accountName: string;
  accountNumber: string;
  bankName?: string;
  className?: string;
}

export function PaymentMethodCard({
  type,
  accountName,
  accountNumber,
  bankName,
  className,
}: PaymentMethodCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(accountNumber);
    setCopied(true);
    toast.success("Account number copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const icon = type === "gcash" ? GCashIcon : BankIcon;

  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-colors hover:border-primary/50",
        className,
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={cn(
            "h-12 w-12 rounded-lg flex items-center justify-center",
            type === "gcash" ? "bg-[#007DFE]/10" : "bg-muted",
          )}
        >
          {icon}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">
              {type === "gcash" ? "GCash" : bankName || "Bank Transfer"}
            </h4>
            {type === "gcash" && (
              <span className="text-[10px] font-medium bg-[#007DFE] text-white px-1.5 py-0.5 rounded">
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

const GCashIcon = (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <title>GCash</title>
    <circle cx="12" cy="12" r="10" fill="#007DFE" />
    <text
      x="12"
      y="16"
      textAnchor="middle"
      fill="white"
      fontSize="10"
      fontWeight="bold"
    >
      G
    </text>
  </svg>
);

const BankIcon = (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className="text-muted-foreground"
    aria-hidden="true"
  >
    <title>Bank</title>
    <path d="M3 21h18" />
    <path d="M3 10h18" />
    <path d="M12 3l9 7H3l9-7z" />
    <path d="M5 10v11" />
    <path d="M9 10v11" />
    <path d="M15 10v11" />
    <path d="M19 10v11" />
  </svg>
);
