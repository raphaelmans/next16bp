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
import { cn } from "@/lib/utils";

export interface MoreSheetItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface MoreSheetSection {
  label?: string;
  items: MoreSheetItem[];
}

interface OwnerMoreSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: MoreSheetSection[];
}

export function OwnerMoreSheet({
  open,
  onOpenChange,
  sections,
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
    if (href === "/organization") {
      return pathname === "/organization";
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

        <nav
          className="px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          aria-label="More navigation"
        >
          {sections.map((section, sectionIdx) => (
            <div key={section.label ?? `section-${sectionIdx}`}>
              {sectionIdx > 0 && <Separator className="my-1" />}
              {section.label && (
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 pt-3 pb-1">
                  {section.label}
                </p>
              )}
              <ul className="space-y-1">
                {section.items.map((item) => {
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
            </div>
          ))}
        </nav>
      </DrawerContent>
    </Drawer>
  );
}
