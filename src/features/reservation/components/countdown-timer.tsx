"use client";

import { AlertCircle, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  expiresAt: string;
  onExpire?: () => void;
}

export function CountdownTimer({ expiresAt, onExpire }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateRemaining = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining(0);
        setIsExpired(true);
        onExpire?.();
        return false;
      }
      setRemaining(diff);
      return true;
    };

    if (!calculateRemaining()) return;

    const interval = setInterval(() => {
      if (!calculateRemaining()) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const isWarning = remaining > 0 && remaining < 5 * 60 * 1000;

  if (isExpired) {
    return (
      <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-4 text-destructive">
        <AlertCircle className="mt-0.5 h-5 w-5" />
        <div>
          <span className="font-medium">Reservation Expired</span>
          <p className="text-sm">The payment window has passed.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg p-4",
        isWarning ? "bg-warning/10 text-warning" : "bg-muted text-foreground",
      )}
    >
      <Clock className="h-5 w-5" />
      <div>
        <span className="font-mono text-lg font-semibold">
          {minutes}:{seconds.toString().padStart(2, "0")}
        </span>
        <span className="ml-2 text-sm">remaining</span>
        {isWarning && <p className="text-sm font-medium">Time running out!</p>}
      </div>
    </div>
  );
}
