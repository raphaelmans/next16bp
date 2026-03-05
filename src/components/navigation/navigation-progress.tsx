"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type ProgressStatus = "idle" | "starting" | "active" | "finishing";

const START_DELAY_MS = 150;
const SETTLE_DELAY_MS = 120;
const FINISH_FADE_MS = 200;
const TICK_INTERVAL_MS = 200;
const START_PROGRESS = 15;
const MAX_PROGRESS = 90;

const prefersReducedMotionQuery = "(prefers-reduced-motion: reduce)";

const isModifiedClick = (event: MouseEvent) =>
  event.button !== 0 ||
  event.metaKey ||
  event.ctrlKey ||
  event.shiftKey ||
  event.altKey;

const getAnchorElement = (target: EventTarget | null) => {
  if (!(target instanceof Element)) return null;
  return target.closest("a[href]") as HTMLAnchorElement | null;
};

const shouldIgnoreAnchor = (anchor: HTMLAnchorElement) => {
  if (anchor.target === "_blank") return true;
  if (anchor.hasAttribute("download")) return true;
  const rel = anchor.getAttribute("rel")?.toLowerCase() ?? "";
  if (rel.includes("external")) return true;
  const href = anchor.getAttribute("href");
  return (
    !href ||
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  );
};

const toUrl = (href: string) => {
  try {
    return new URL(href, window.location.href);
  } catch {
    return null;
  }
};

const usePrefersReducedMotion = () => {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia(prefersReducedMotionQuery);
    const handleChange = () => setPrefersReduced(mediaQuery.matches);
    handleChange();
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  return prefersReduced;
};

export function NavigationProgress() {
  const pathname = usePathname();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [status, setStatus] = useState<ProgressStatus>("idle");
  const [progress, setProgress] = useState(0);

  const statusRef = useRef<ProgressStatus>("idle");
  const progressRef = useRef(0);
  const previousPathRef = useRef(pathname);
  const startTimerRef = useRef<number | null>(null);
  const settleTimerRef = useRef<number | null>(null);
  const finishTimerRef = useRef<number | null>(null);
  const tickTimerRef = useRef<number | null>(null);

  const setStatusSafe = useCallback((nextStatus: ProgressStatus) => {
    statusRef.current = nextStatus;
    setStatus(nextStatus);
  }, []);

  const setProgressSafe = useCallback((nextValue: number) => {
    progressRef.current = nextValue;
    setProgress(nextValue);
  }, []);

  const clearTimer = useCallback((ref: { current: number | null }) => {
    if (ref.current !== null) {
      window.clearTimeout(ref.current);
      ref.current = null;
    }
  }, []);

  const stopTick = useCallback(() => {
    if (tickTimerRef.current !== null) {
      window.clearTimeout(tickTimerRef.current);
      tickTimerRef.current = null;
    }
  }, []);

  const startTick = useCallback(() => {
    stopTick();
    const tick = () => {
      setProgress((prev) => {
        const next =
          prev >= MAX_PROGRESS
            ? prev
            : Math.min(MAX_PROGRESS, prev + 2 + Math.round(Math.random() * 4));
        progressRef.current = next;
        return next;
      });
      tickTimerRef.current = window.setTimeout(tick, TICK_INTERVAL_MS);
    };
    tickTimerRef.current = window.setTimeout(tick, TICK_INTERVAL_MS);
  }, [stopTick]);

  const finish = useCallback(() => {
    clearTimer(startTimerRef);
    stopTick();

    if (statusRef.current === "starting" && progressRef.current === 0) {
      setStatusSafe("idle");
      return;
    }

    setStatusSafe("finishing");
    setProgressSafe(100);
    clearTimer(finishTimerRef);
    finishTimerRef.current = window.setTimeout(() => {
      setStatusSafe("idle");
      setProgressSafe(0);
    }, FINISH_FADE_MS);
  }, [clearTimer, setProgressSafe, setStatusSafe, stopTick]);

  const start = useCallback(
    (nextPathname: string, currentPathname = window.location.pathname) => {
      if (!nextPathname || nextPathname === currentPathname) return;
      if (statusRef.current === "active" || statusRef.current === "starting") {
        return;
      }
      clearTimer(finishTimerRef);
      setStatusSafe("starting");
      setProgressSafe(0);
      clearTimer(startTimerRef);
      startTimerRef.current = window.setTimeout(() => {
        setStatusSafe("active");
        setProgressSafe(START_PROGRESS);
        startTick();
      }, START_DELAY_MS);
    },
    [clearTimer, setProgressSafe, setStatusSafe, startTick],
  );

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (isModifiedClick(event)) return;
      const anchor = getAnchorElement(event.target);
      if (!anchor || shouldIgnoreAnchor(anchor)) return;
      const url = toUrl(anchor.href);
      if (!url || url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return;
      start(url.pathname);
    };

    const handlePopState = () => {
      start(window.location.pathname, previousPathRef.current);
    };

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    const handleHistoryCall = (url?: string | URL | null) => {
      if (!url) return;
      const resolvedUrl = toUrl(typeof url === "string" ? url : url.toString());
      if (!resolvedUrl) return;
      if (resolvedUrl.origin !== window.location.origin) return;
      if (resolvedUrl.pathname === window.location.pathname) return;
      start(resolvedUrl.pathname);
    };

    window.history.pushState = function (...args) {
      handleHistoryCall(args[2] ?? null);
      return originalPushState.apply(this, args);
    };

    window.history.replaceState = function (...args) {
      handleHistoryCall(args[2] ?? null);
      return originalReplaceState.apply(this, args);
    };

    document.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", handlePopState);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, [start]);

  useEffect(() => {
    if (previousPathRef.current === pathname) return;
    previousPathRef.current = pathname;
    clearTimer(settleTimerRef);
    settleTimerRef.current = window.setTimeout(() => {
      finish();
    }, SETTLE_DELAY_MS);
  }, [pathname, clearTimer, finish]);

  useEffect(() => {
    const mainContent = document.getElementById("main-content");
    if (!mainContent) return;
    if (status === "idle") {
      mainContent.removeAttribute("aria-busy");
    } else {
      mainContent.setAttribute("aria-busy", "true");
    }
  }, [status]);

  useEffect(() => {
    return () => {
      clearTimer(startTimerRef);
      clearTimer(settleTimerRef);
      clearTimer(finishTimerRef);
      stopTick();
    };
  }, [clearTimer, stopTick]);

  const isVisible = status !== "idle";

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-[100] transition-opacity duration-200",
        isVisible ? "opacity-100" : "opacity-0",
      )}
      role="progressbar"
      aria-label="Loading"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
    >
      <div className="relative h-[6px] w-full">
        <div
          className={cn(
            "relative h-full origin-left overflow-hidden rounded-full transition-[width] duration-150 ease-out",
            "bg-gradient-to-r from-primary via-accent to-primary shadow-[0_0_10px_color-mix(in_oklch,var(--color-primary)_25%,transparent)]",
          )}
          style={{ width: `${progress}%` }}
        >
          {!prefersReducedMotion && (
            <span
              className={cn(
                "pointer-events-none absolute inset-0",
                "before:absolute before:inset-0 before:block before:content-['']",
                "before:bg-[linear-gradient(90deg,transparent,oklch(1_0_0/0.6),transparent)] before:opacity-70",
                "before:translate-x-[-60%] before:animate-[courtline-scan_1.6s_linear_infinite]",
              )}
            />
          )}
        </div>
      </div>
    </div>
  );
}
