"use client";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useReservationCounts } from "../hooks/use-my-reservations";
import {
  type ReservationTab,
  reservationTabs,
  useReservationsTabs,
} from "../hooks/use-reservations-tabs";
import { ReservationList } from "./reservation-list";

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
      className="w-full gap-4"
    >
      <TabsList className="w-full sm:w-auto">
        {reservationTabs.map((tabKey) => {
          const count = counts?.[tabKey] ?? 0;
          const label = tabLabels[tabKey];
          const accessibleLabel = count > 0 ? `${label}, ${count}` : label;
          return (
            <TabsTrigger
              key={tabKey}
              value={tabKey}
              className="flex items-center gap-2"
              aria-label={accessibleLabel}
            >
              {label}
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
      {reservationTabs.map((tabKey) => (
        <TabsContent key={tabKey} value={tabKey}>
          <ReservationList tab={tabKey} isActive={tab === tabKey} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
