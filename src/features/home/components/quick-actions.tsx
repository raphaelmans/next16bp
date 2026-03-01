"use client";

import {
  Building2,
  CalendarDays,
  type LucideIcon,
  Search,
  Shield,
  User,
} from "lucide-react";
import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface QuickActionCardProps {
  title: string;
  icon: LucideIcon;
  href: string;
  description: string;
  className?: string;
  iconClassName?: string;
}

function QuickActionCard({
  title,
  icon: Icon,
  href,
  description,
  className,
  iconClassName,
}: QuickActionCardProps) {
  return (
    <Link href={href} className="block h-full">
      <Card
        className={cn("h-full transition-colors hover:bg-muted/50", className)}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon
            className={cn("h-4 w-4 text-muted-foreground", iconClassName)}
          />
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

interface QuickActionsProps {
  isAdmin?: boolean;
  isOwner?: boolean;
}

export function QuickActions({ isAdmin, isOwner }: QuickActionsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <QuickActionCard
        title="Find Courts"
        icon={Search}
        href={appRoutes.courts.base}
        description="Browse available courts near you"
      />
      <QuickActionCard
        title="My Reservations"
        icon={CalendarDays}
        href={appRoutes.reservations.base}
        description="View and manage your bookings"
      />
      <QuickActionCard
        title="Profile"
        icon={User}
        href={appRoutes.account.profile}
        description="Update your personal information"
      />

      {isOwner && (
        <QuickActionCard
          title="Venue Dashboard"
          icon={Building2}
          href={appRoutes.organization.base}
          description="Manage your organization and courts"
          className="border-primary/20 bg-primary/5 hover:bg-primary/10"
          iconClassName="text-primary"
        />
      )}

      {isAdmin && (
        <QuickActionCard
          title="Admin Dashboard"
          icon={Shield}
          href={appRoutes.admin.base}
          description="System administration and monitoring"
          className="border-destructive/20 bg-destructive/5 hover:bg-destructive/10"
          iconClassName="text-destructive"
        />
      )}
    </div>
  );
}
