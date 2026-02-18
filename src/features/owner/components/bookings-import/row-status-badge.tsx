"use client";

import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type RowStatusBadgeProps = {
  status: string;
};

export function RowStatusBadge({ status }: RowStatusBadgeProps) {
  switch (status) {
    case "VALID":
      return (
        <Badge variant="success" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Valid
        </Badge>
      );
    case "ERROR":
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Error
        </Badge>
      );
    case "WARNING":
      return (
        <Badge variant="warning" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Warning
        </Badge>
      );
    case "COMMITTED":
      return (
        <Badge variant="secondary" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Committed
        </Badge>
      );
    case "SKIPPED":
      return (
        <Badge variant="outline" className="gap-1">
          Skipped
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
