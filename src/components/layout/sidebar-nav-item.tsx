"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import {
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface SidebarNavItemProps {
  href: string;
  title: string;
  icon: LucideIcon;
  isActive: boolean;
  activeClassName?: string;
  tooltip?: string;
  badgeCount?: number;
  badgeClassName?: string;
  badgeMax?: number;
  showZeroBadge?: boolean;
  className?: string;
  linkClassName?: string;
}

export function SidebarNavItem({
  href,
  title,
  icon: Icon,
  isActive,
  activeClassName,
  tooltip,
  badgeCount,
  badgeClassName,
  badgeMax = 99,
  showZeroBadge = false,
  className,
  linkClassName,
}: SidebarNavItemProps) {
  const shouldShowBadge =
    typeof badgeCount === "number" && (showZeroBadge || badgeCount > 0);

  const badgeLabel = shouldShowBadge
    ? badgeCount > badgeMax
      ? `${badgeMax}+`
      : `${badgeCount}`
    : null;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={tooltip}
        className={cn(
          isActive && activeClassName,
          shouldShowBadge && "pr-8",
          className,
        )}
      >
        <Link href={href} className={cn("font-heading", linkClassName)}>
          <Icon className="h-4 w-4" />
          <span>{title}</span>
        </Link>
      </SidebarMenuButton>

      {badgeLabel ? (
        <SidebarMenuBadge className={badgeClassName}>
          {badgeLabel}
        </SidebarMenuBadge>
      ) : null}
    </SidebarMenuItem>
  );
}
