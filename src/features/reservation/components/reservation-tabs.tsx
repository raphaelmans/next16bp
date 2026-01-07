"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  useReservationsTabs,
  reservationTabs,
  type ReservationTab,
} from "../hooks/use-reservations-tabs";
import { useReservationCounts } from "../hooks/use-my-reservations";
import { cn } from "@/lib/utils";

const tabLabels: Record<ReservationTab, string> = {
  upcoming: "Upcoming",
  past: "Past",
  cancelled: "Cancelled",
};

export function ReservationTabs() {
  const { tab, setTab } = useReservationsTabs();
  const { data: counts } = useReservationCounts();

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => setTab(value as ReservationTab)}
      className="w-full"
    >
      <TabsList className="w-full sm:w-auto">
        {reservationTabs.map((tabKey) => {
          const count = counts?.[tabKey] ?? 0;
          return (
            <TabsTrigger
              key={tabKey}
              value={tabKey}
              className="flex items-center gap-2"
            >
              {tabLabels[tabKey]}
              {count > 0 && (
                <Badge
                  variant={tab === tabKey ? "default" : "secondary"}
                  className={cn(
                    "min-w-[20px] h-5 px-1.5",
                    tab === tabKey && "bg-primary-foreground text-primary",
                  )}
                >
                  {count}
                </Badge>
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
