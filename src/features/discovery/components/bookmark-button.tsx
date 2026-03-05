"use client";

import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BookmarkButtonProps = {
  variant: "overlay" | "inline";
  isBookmarked: boolean;
  isPending?: boolean;
  onToggle: () => void;
};

export function BookmarkButton({
  variant,
  isBookmarked,
  isPending,
  onToggle,
}: BookmarkButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    if (isPending) return;
    onToggle();
  };

  if (variant === "overlay") {
    return (
      <button
        type="button"
        aria-label={isBookmarked ? "Remove from saved" : "Save venue"}
        onClick={handleClick}
        disabled={isPending}
        className={cn(
          "absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 shadow-sm backdrop-blur transition-transform duration-200 ease-in-out hover:scale-110",
          isPending && "opacity-70",
        )}
      >
        <Heart
          className={cn(
            "h-4 w-4 transition-colors duration-200",
            isBookmarked ? "fill-accent text-accent" : "text-muted-foreground",
          )}
        />
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant={isBookmarked ? "accent" : "outline"}
      size="sm"
      onClick={handleClick}
      disabled={isPending}
    >
      <Heart className={cn("h-4 w-4", isBookmarked && "fill-current")} />
      {isBookmarked ? "Saved" : "Save"}
    </Button>
  );
}
