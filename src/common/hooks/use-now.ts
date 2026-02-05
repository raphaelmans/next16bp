"use client";

import * as React from "react";

export function useNowMs(options?: { intervalMs?: number }): number {
  const intervalMs = options?.intervalMs ?? 60_000;

  const [nowMs, setNowMs] = React.useState(() => Date.now());

  React.useEffect(() => {
    const id = window.setInterval(() => {
      setNowMs(Date.now());
    }, intervalMs);

    return () => {
      window.clearInterval(id);
    };
  }, [intervalMs]);

  return nowMs;
}
