"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdminPageRefreshButtonProps {
  label?: string;
}

export function AdminPageRefreshButton({
  label = "Refresh",
}: AdminPageRefreshButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleRefresh}
      disabled={isPending}
    >
      <RefreshCw className={cn("mr-2 h-4 w-4", isPending && "animate-spin")} />
      {label}
    </Button>
  );
}
