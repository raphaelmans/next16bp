"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export const SKIP_NEXT_ROUTE_SCROLL_EVENT =
  "kudoscourts:skip-next-route-scroll";

export const requestSkipNextRouteScroll = () => {
  window.dispatchEvent(new Event(SKIP_NEXT_ROUTE_SCROLL_EVENT));
};

export function RouteScrollManager() {
  const pathname = usePathname();
  const skipNextScrollRef = useRef(false);
  const previousPathnameRef = useRef(pathname);

  useEffect(() => {
    const handlePopState = () => {
      skipNextScrollRef.current = true;
    };
    const handleSkipNextRouteScroll = () => {
      skipNextScrollRef.current = true;
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener(
      SKIP_NEXT_ROUTE_SCROLL_EVENT,
      handleSkipNextRouteScroll,
    );

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener(
        SKIP_NEXT_ROUTE_SCROLL_EVENT,
        handleSkipNextRouteScroll,
      );
    };
  }, []);

  useEffect(() => {
    if (previousPathnameRef.current === pathname) {
      return;
    }

    previousPathnameRef.current = pathname;

    if (skipNextScrollRef.current) {
      skipNextScrollRef.current = false;
      return;
    }

    if (window.location.hash) {
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}
