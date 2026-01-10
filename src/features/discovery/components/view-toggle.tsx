"use client";

import { List, Map as MapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ViewMode = "list" | "map";

interface ViewToggleProps {
  value: ViewMode;
  onChange: (view: ViewMode) => void;
  className?: string;
}

export function ViewToggle({ value, onChange, className }: ViewToggleProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border bg-muted p-1",
        className,
      )}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange("list")}
        className={cn(
          "rounded-md px-3",
          value === "list" && "bg-background shadow-sm",
        )}
      >
        <List className="h-4 w-4 mr-2" />
        List
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange("map")}
        className={cn(
          "rounded-md px-3",
          value === "map" && "bg-background shadow-sm",
        )}
      >
        <MapIcon className="h-4 w-4 mr-2" />
        Map
      </Button>
    </div>
  );
}
