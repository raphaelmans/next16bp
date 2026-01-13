"use client";

import { parseAsString, useQueryState } from "nuqs";
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

export function useOwnerCourtFilter(options?: {
  storageKey?: string;
  syncToUrl?: boolean;
}) {
  const storageKey = options?.storageKey ?? DEFAULT_STORAGE_KEY;
  const syncToUrl = options?.syncToUrl ?? true;

  const [queryCourtId, setQueryCourtId] = useQueryState(
    COURT_ID_PARAM,
    parseAsString.withOptions({ history: "replace" }),
  );

  const paramCourtId = syncToUrl ? (queryCourtId ?? "") : "";
  const [courtId, setCourtIdState] = React.useState<string>("");

  React.useEffect(() => {
    if (paramCourtId) {
      setCourtIdState(paramCourtId);
      writeStoredCourtId(storageKey, paramCourtId);
      return;
    }

    const stored = readStoredCourtId(storageKey);
    setCourtIdState(stored);

    if (stored && syncToUrl && !queryCourtId) {
      setQueryCourtId(stored);
    }
  }, [paramCourtId, queryCourtId, setQueryCourtId, storageKey, syncToUrl]);

  const setCourtId = React.useCallback(
    (nextCourtId: string) => {
      setCourtIdState(nextCourtId);
      writeStoredCourtId(storageKey, nextCourtId);

      if (!syncToUrl) {
        return;
      }

      setQueryCourtId(nextCourtId || null);
    },
    [setQueryCourtId, storageKey, syncToUrl],
  );

  return { courtId, setCourtId };
}
