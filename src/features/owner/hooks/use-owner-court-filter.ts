"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

const DEFAULT_STORAGE_KEY = "owner.selectedCourtId";
const COURT_ID_PARAM = "courtId";

function readStoredCourtId(storageKey: string) {
  try {
    return window.localStorage.getItem(storageKey) ?? "";
  } catch {
    return "";
  }
}

function writeStoredCourtId(storageKey: string, courtId: string) {
  try {
    if (!courtId) {
      window.localStorage.removeItem(storageKey);
      return;
    }
    window.localStorage.setItem(storageKey, courtId);
  } catch {
    // ignore
  }
}

export function useOwnerCourtFilter(options?: { storageKey?: string }) {
  const storageKey = options?.storageKey ?? DEFAULT_STORAGE_KEY;

  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();

  const paramCourtId = searchParams.get(COURT_ID_PARAM) ?? "";
  const [courtId, setCourtIdState] = React.useState<string>("");

  React.useEffect(() => {
    if (paramCourtId) {
      setCourtIdState(paramCourtId);
      writeStoredCourtId(storageKey, paramCourtId);
      return;
    }

    const stored = readStoredCourtId(storageKey);
    setCourtIdState(stored);

    if (stored) {
      const params = new URLSearchParams(searchParamsString);
      params.set(COURT_ID_PARAM, stored);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [paramCourtId, pathname, router, searchParamsString, storageKey]);

  const setCourtId = React.useCallback(
    (nextCourtId: string) => {
      setCourtIdState(nextCourtId);
      writeStoredCourtId(storageKey, nextCourtId);

      const params = new URLSearchParams(searchParamsString);
      if (nextCourtId) {
        params.set(COURT_ID_PARAM, nextCourtId);
      } else {
        params.delete(COURT_ID_PARAM);
      }

      const nextUrl = params.toString()
        ? `${pathname}?${params.toString()}`
        : pathname;
      router.replace(nextUrl, { scroll: false });
    },
    [pathname, router, searchParamsString, storageKey],
  );

  return { courtId, setCourtId };
}
