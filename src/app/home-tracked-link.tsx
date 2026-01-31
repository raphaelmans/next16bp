"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  type TelemetryEventName,
  trackEvent,
} from "@/common/clients/telemetry-client";

interface HomeTrackedLinkProps {
  href: string;
  event: TelemetryEventName;
  properties?: Record<string, unknown>;
  className?: string;
  children: ReactNode;
}

export function HomeTrackedLink({
  href,
  event,
  properties,
  className,
  children,
}: HomeTrackedLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => trackEvent({ event, properties })}
    >
      {children}
    </Link>
  );
}
