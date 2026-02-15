"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function RouteScrollManager() {
  const pathname = usePathname();
  const skipNextScrollRef = useRef(false);
  const previousPathnameRef = useRef(pathname);

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
