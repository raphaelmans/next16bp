"use client";

import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LocationPin } from "./location-pin";

interface EmptyStateProps {
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const IconComponent = Icon || LocationPin;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className,
      )}
    >
      <div className="rounded-full bg-muted p-4 mb-4">
        <IconComponent className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-heading font-semibold text-lg text-foreground mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-4">
          {description}
        </p>
      )}
      {action && (
        <Button
          variant="outline"
          onClick={action.onClick}
          asChild={!!action.href}
        >
          {action.href ? (
            <a href={action.href}>{action.label}</a>
          ) : (
            action.label
          )}
        </Button>
      )}
    </div>
  );
}
