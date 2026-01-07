"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ReservationsError({ error, reset }: ErrorProps) {
  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-md">
        <div className="flex flex-col items-center justify-center text-center py-12">
          <div className="rounded-full bg-destructive/10 p-4 mb-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold font-heading mb-2">
            Something went wrong
          </h2>
          <p className="text-muted-foreground mb-6">
            We encountered an error loading your reservations. Please try again.
          </p>
          <Button onClick={reset} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try again
          </Button>
          {process.env.NODE_ENV === "development" && (
            <p className="mt-4 text-xs text-muted-foreground font-mono">
              {error.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
