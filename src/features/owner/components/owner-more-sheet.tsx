"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { PortalSwitcher } from "@/features/auth/components/portal-switcher";
import { cn } from "@/lib/utils";

interface MoreSheetItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface OwnerMoreSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: MoreSheetItem[];
}

export function OwnerMoreSheet({
  open,
  onOpenChange,
  items,
}: OwnerMoreSheetProps) {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);

  // Close sheet on navigation
  useEffect(() => {
    if (prevPathname.current !== pathname && open) {
      onOpenChange(false);
    }
    prevPathname.current = pathname;
  }, [pathname, open, onOpenChange]);

  const isActive = (href: string) => {
    if (href === "/owner") {
      return pathname === "/owner";
    }
    return pathname.startsWith(href);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="sr-only">
          <DrawerTitle>More</DrawerTitle>
          <DrawerDescription>Additional navigation options</DrawerDescription>
        </DrawerHeader>

        <nav className="px-4 pb-2" aria-label="More navigation">
          <ul className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-heading transition-colors min-h-[44px]",
                      active
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-foreground hover:bg-muted",
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <Separator className="mx-4" />

        <div className="px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <PortalSwitcher variant="menu-items" isOwner />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
