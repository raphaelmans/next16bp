"use client";

import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";

export const selectionModeSchema = ["any", "court"] as const;
export const viewModeSchema = ["week", "day"] as const;

export const placeDetailUrlParams = {
  date: parseAsString.withOptions({ history: "replace" }),
  duration: parseAsInteger.withOptions({ history: "replace" }),
  sportId: parseAsString.withOptions({ history: "replace" }),
  mode: parseAsStringLiteral(selectionModeSchema).withOptions({
    history: "replace",
  }),
  courtId: parseAsString.withOptions({ history: "replace" }),
  startTime: parseAsString.withOptions({ history: "replace" }),
  anyView: parseAsStringLiteral(viewModeSchema).withOptions({
    history: "replace",
  }),
  courtView: parseAsStringLiteral(viewModeSchema).withOptions({
    history: "replace",
  }),
};

export function usePlaceDetailUrlState() {
  return useQueryStates(placeDetailUrlParams, {
    history: "replace",
    shallow: true,
  });
}
