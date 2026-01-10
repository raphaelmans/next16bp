"use client";

import { type LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    label?: string;
  };
  href?: string;
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  href,
  className,
}: StatsCardProps) {
  const content = (
    <Card
      className={cn(
        "transition-colors",
        href && "cursor-pointer hover:bg-muted/50",
        className,
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold font-heading tracking-tight">
              {value}
            </p>
            {trend && (
              <div className="flex items-center gap-1 text-sm">
                {trend.value >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span
                  className={cn(
                    "font-medium",
                    trend.value >= 0 ? "text-green-600" : "text-red-600",
                  )}
                >
                  {trend.value > 0 ? "+" : ""}
                  {trend.value}%
                </span>
                {trend.label && (
                  <span className="text-muted-foreground">{trend.label}</span>
                )}
              </div>
            )}
          </div>
          <div className="rounded-lg bg-primary/10 p-3">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
