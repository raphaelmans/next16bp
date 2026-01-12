"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

const DEFAULT_STORAGE_KEY = "owner.selectedPlaceId";
const PLACE_ID_PARAM = "placeId";

function readStoredPlaceId(storageKey: string) {
  try {
    return window.localStorage.getItem(storageKey) ?? "";
  } catch {
    return "";
  }
}

function writeStoredPlaceId(storageKey: string, placeId: string) {
  try {
    if (!placeId) {
      window.localStorage.removeItem(storageKey);
      return;
    }
    window.localStorage.setItem(storageKey, placeId);
  } catch {
    // ignore
  }
}

export function useOwnerPlaceFilter(options?: { storageKey?: string }) {
  const storageKey = options?.storageKey ?? DEFAULT_STORAGE_KEY;

  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();

  const paramPlaceId = searchParams.get(PLACE_ID_PARAM) ?? "";
  const [placeId, setPlaceIdState] = React.useState<string>("");

  React.useEffect(() => {
    if (paramPlaceId) {
      setPlaceIdState(paramPlaceId);
      writeStoredPlaceId(storageKey, paramPlaceId);
      return;
    }

    const stored = readStoredPlaceId(storageKey);
    setPlaceIdState(stored);

    if (stored) {
      const params = new URLSearchParams(searchParamsString);
      params.set(PLACE_ID_PARAM, stored);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [paramPlaceId, pathname, router, searchParamsString, storageKey]);

  const setPlaceId = React.useCallback(
    (nextPlaceId: string) => {
      setPlaceIdState(nextPlaceId);
      writeStoredPlaceId(storageKey, nextPlaceId);

      const params = new URLSearchParams(searchParamsString);
      if (nextPlaceId) {
        params.set(PLACE_ID_PARAM, nextPlaceId);
      } else {
        params.delete(PLACE_ID_PARAM);
      }

      const nextUrl = params.toString()
        ? `${pathname}?${params.toString()}`
        : pathname;
      router.replace(nextUrl, { scroll: false });
    },
    [pathname, router, searchParamsString, storageKey],
  );

  return { placeId, setPlaceId };
}
