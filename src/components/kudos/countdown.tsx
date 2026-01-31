"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface CountdownProps {
  expiresAt: Date | string;
  onExpire?: () => void;
  format?: "short" | "long";
  className?: string;
}

export function Countdown({
  expiresAt,
  onExpire,
  format = "short",
  className,
}: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const calculateTimeLeft = useCallback(() => {
    const expiry =
      typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
    const diff = expiry.getTime() - Date.now();
    return Math.max(0, diff);
  }, [expiresAt]);

  useEffect(() => {
    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [calculateTimeLeft, onExpire]);

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  const isLow = minutes < 2;
  const isWarning = minutes >= 2 && minutes < 5;

  const formatDisplay = () => {
    if (format === "long") {
      if (minutes > 0) {
        return `${minutes} minute${minutes !== 1 ? "s" : ""} remaining`;
      }
      return `${seconds} second${seconds !== 1 ? "s" : ""} remaining`;
    }
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  if (timeLeft <= 0) {
    return (
      <span className={cn("font-mono font-medium text-destructive", className)}>
        Expired
      </span>
    );
  }

  return (
    <span
      className={cn(
        "font-mono font-medium tabular-nums",
        isLow && "text-destructive animate-pulse",
        isWarning && "text-warning",
        !isLow && !isWarning && "text-foreground",
        className,
      )}
    >
      {formatDisplay()}
    </span>
  );
}

interface CountdownBannerProps {
  expiresAt: Date | string;
  onExpire?: () => void;
  className?: string;
}

export function CountdownBanner({
  expiresAt,
  onExpire,
  className,
}: CountdownBannerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const calculateTimeLeft = useCallback(() => {
    const expiry =
      typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
    const diff = expiry.getTime() - Date.now();
    return Math.max(0, diff);
  }, [expiresAt]);

  useEffect(() => {
    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [calculateTimeLeft, onExpire]);

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  const isLow = minutes < 2;
  const isWarning = minutes >= 2 && minutes < 5;

  if (timeLeft <= 0) {
    return (
      <div
        className={cn(
          "w-full py-2 px-4 text-center font-medium bg-destructive text-destructive-foreground",
          className,
        )}
      >
        Time expired
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full py-2 px-4 text-center font-medium",
        isLow && "bg-destructive text-destructive-foreground animate-pulse",
        isWarning && "bg-warning text-warning-foreground",
        !isLow && !isWarning && "bg-primary/10 text-primary",
        className,
      )}
    >
      Complete payment within{" "}
      <span className="font-mono tabular-nums">
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </span>
    </div>
  );
}
