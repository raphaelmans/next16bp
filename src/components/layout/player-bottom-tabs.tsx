"use client";

import type { LucideIcon } from "lucide-react";
import { CalendarDays, Home, MapPin, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { appRoutes } from "@/common/app-routes";
import { cn } from "@/lib/utils";

interface TabConfig {
  label: string;
  href: string;
  icon: LucideIcon;
}

const tabs: TabConfig[] = [
  { label: "Courts", href: appRoutes.courts.base, icon: MapPin },
  {
    label: "Reservations",
    href: appRoutes.reservations.base,
    icon: CalendarDays,
  },
  { label: "Home", href: appRoutes.home.base, icon: Home },
  { label: "Profile", href: appRoutes.account.profile, icon: User },
];

export function PlayerBottomTabs() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === appRoutes.home.base) {
      return pathname === appRoutes.home.base;
    }
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 md:hidden border-t bg-background/95 backdrop-blur-md pb-[max(0px,env(safe-area-inset-bottom))]"
      aria-label="Bottom navigation"
    >
      <div className="flex h-14 items-stretch">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] transition-colors",
                active ? "text-primary font-semibold" : "text-muted-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-heading leading-tight">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
