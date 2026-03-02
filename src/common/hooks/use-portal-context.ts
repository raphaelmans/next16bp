"use client";

import { usePathname } from "next/navigation";

type PortalContext = "player" | "organization" | "admin";

/**
 * Returns the user's current portal context.
 *
 * For unambiguous routes (/organization/*, /admin/*) it uses the pathname.
 * For shared routes like /account/* it reads the `kudos.portal-context` cookie
 * that both shells write on mount.
 */
export function usePortalContext(): PortalContext {
  const pathname = usePathname();

  if (pathname.startsWith("/organization")) return "organization";
  if (pathname.startsWith("/admin")) return "admin";

  // For ambiguous routes (/account/*, etc.), read cookie
  try {
    const match = document.cookie.match(
      /(?:^|;\s*)kudos\.portal-context=(\w+)/,
    );
    if (match?.[1] === "organization") return "organization";
    if (match?.[1] === "admin") return "admin";
  } catch {}

  return "player";
}
