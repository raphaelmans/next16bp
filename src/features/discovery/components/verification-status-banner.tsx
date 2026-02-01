"use client";

import { AlertCircle, Clock, XCircle } from "lucide-react";
import type { PlaceVerificationStatusVariant } from "@/features/discovery/helpers";

const iconMap = {
  warning: <Clock className="h-4 w-4 text-warning" />,
  destructive: <XCircle className="h-4 w-4 text-destructive" />,
  muted: <AlertCircle className="h-4 w-4 text-muted-foreground" />,
  success: null,
} as const;

interface VerificationStatusBannerProps {
  message: string;
  description?: string;
  variant: PlaceVerificationStatusVariant;
}

export function VerificationStatusBanner({
  message,
  description,
  variant,
}: VerificationStatusBannerProps) {
  const icon = iconMap[variant];
  return (
    <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
      <div className="flex items-center gap-2 font-medium text-foreground">
        {icon}
        {message}
      </div>
      {description && (
        <p className="text-xs text-muted-foreground mt-2">{description}</p>
      )}
    </div>
  );
}
