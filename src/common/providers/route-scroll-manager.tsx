"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

export function RouteScrollManager() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const currentRoute = search ? `${pathname}?${search}` : pathname;
  const skipNextScrollRef = useRef(false);
  const previousRouteRef = useRef(currentRoute);

  useEffect(() => {
    const handlePopState = () => {
      skipNextScrollRef.current = true;
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    if (previousRouteRef.current === currentRoute) {
      return;
    }

    previousRouteRef.current = currentRoute;

    if (skipNextScrollRef.current) {
      skipNextScrollRef.current = false;
      return;
    }

    if (window.location.hash) {
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [currentRoute]);

  return null;
}
