"use client";

import { parseAsString, useQueryState } from "nuqs";
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

export function useOwnerPlaceFilter(options?: {
  storageKey?: string;
  syncToUrl?: boolean;
}) {
  const storageKey = options?.storageKey ?? DEFAULT_STORAGE_KEY;
  const syncToUrl = options?.syncToUrl ?? true;

  const [queryPlaceId, setQueryPlaceId] = useQueryState(
    PLACE_ID_PARAM,
    parseAsString.withOptions({ history: "replace" }),
  );

  const paramPlaceId = syncToUrl ? (queryPlaceId ?? "") : "";
  const [placeId, setPlaceIdState] = React.useState<string>("");

  React.useEffect(() => {
    if (paramPlaceId) {
      setPlaceIdState(paramPlaceId);
      writeStoredPlaceId(storageKey, paramPlaceId);
      return;
    }

    const stored = readStoredPlaceId(storageKey);
    setPlaceIdState(stored);

    if (stored && syncToUrl && !queryPlaceId) {
      setQueryPlaceId(stored);
    }
  }, [paramPlaceId, queryPlaceId, setQueryPlaceId, storageKey, syncToUrl]);

  const setPlaceId = React.useCallback(
    (nextPlaceId: string) => {
      setPlaceIdState(nextPlaceId);
      writeStoredPlaceId(storageKey, nextPlaceId);

      if (!syncToUrl) {
        return;
      }

      setQueryPlaceId(nextPlaceId || null);
    },
    [setQueryPlaceId, storageKey, syncToUrl],
  );

  return { placeId, setPlaceId };
}
