"use client";

import { parseAsStringLiteral, useQueryState } from "nuqs";

export const reservationTabs = ["upcoming", "past", "cancelled"] as const;
export type ReservationTab = (typeof reservationTabs)[number];

export function useReservationsTabs() {
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsStringLiteral(reservationTabs)
      .withDefault("upcoming")
      .withOptions({ history: "push" }),
  );

  return { tab, setTab };
}
