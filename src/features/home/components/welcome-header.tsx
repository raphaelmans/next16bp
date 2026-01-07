"use client";

import { Skeleton } from "@/components/ui/skeleton";

interface WelcomeHeaderProps {
  name?: string | null;
  isLoading?: boolean;
}

export function WelcomeHeader({ name, isLoading }: WelcomeHeaderProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
    );
  }

  const displayName = name || "Player";

  return (
    <div className="space-y-1">
      <h1 className="text-3xl font-bold tracking-tight">
        Welcome back, {displayName}
      </h1>
      <p className="text-muted-foreground">
        Here's what's happening with your courts today.
      </p>
    </div>
  );
}
