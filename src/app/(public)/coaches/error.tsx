"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function CoachesError({ error, reset }: ErrorProps) {
  return (
    <div className="min-h-[60vh] py-12">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 rounded-full bg-destructive/10 p-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="mb-2 font-heading text-xl font-semibold">
            Something went wrong
          </h2>
          <p className="mb-6 text-muted-foreground">
            We encountered an error loading coaches. Please try again.
          </p>
          <Button onClick={reset} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
          {process.env.NODE_ENV === "development" ? (
            <p className="mt-4 font-mono text-xs text-muted-foreground">
              {error.message}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
