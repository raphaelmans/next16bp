"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appRoutes } from "@/common/app-routes";
import { cn } from "@/lib/utils";

type CourtPageNavProps = {
  placeId: string;
  courtId: string;
};

const navItems = [
  { label: "Edit Details", routeKey: "edit" as const },
  { label: "Schedule & Pricing", routeKey: "schedule" as const },
  { label: "Availability", routeKey: "availability" as const },
];

function getHref(
  routeKey: "edit" | "schedule" | "availability",
  placeId: string,
  courtId: string,
) {
  const routes = appRoutes.organization.places.courts;
  switch (routeKey) {
    case "edit":
      return routes.edit(placeId, courtId);
    case "schedule":
      return routes.schedule(placeId, courtId);
    case "availability":
      return routes.availability(placeId, courtId);
  }
}

export function CourtPageNav({ placeId, courtId }: CourtPageNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className="bg-muted text-muted-foreground inline-flex h-9 w-fit items-center rounded-lg p-[3px] overflow-x-auto"
      aria-label="Court navigation"
    >
      {navItems.map((item) => {
        const href = getHref(item.routeKey, placeId, courtId);
        const isActive = pathname === href;

        return (
          <Link
            key={item.routeKey}
            href={href}
            className={cn(
              "inline-flex h-[calc(100%-1px)] items-center justify-center rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow]",
              "text-foreground",
              isActive &&
                "bg-background shadow-sm",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
