"use client";

import { Search } from "lucide-react";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DiscoverySearchFieldProps {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  className?: string;
  placeholder?: string;
  buttonLabel?: string;
}

export function DiscoverySearchField({
  value,
  onValueChange,
  onSubmit,
  className,
  placeholder = "Search venues, city, or sport...",
  buttonLabel = "Search",
}: DiscoverySearchFieldProps) {
  const inputId = useId();

  return (
    <form
      className={cn("relative", className)}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <label htmlFor={inputId} className="sr-only">
        Search venues
      </label>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        id={inputId}
        type="text"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 rounded-xl border-border/60 bg-background/95 pl-10 pr-24 shadow-sm"
      />
      <Button
        type="submit"
        size="sm"
        className="absolute right-1.5 top-1/2 h-9 -translate-y-1/2 rounded-lg px-3"
      >
        {buttonLabel}
      </Button>
    </form>
  );
}
