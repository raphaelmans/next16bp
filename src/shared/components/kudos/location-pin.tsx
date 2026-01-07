"use client";

import { cn } from "@/lib/utils";

interface LocationPinProps extends React.ComponentProps<"svg"> {
  size?: number;
  color?: string;
}

export function LocationPin({
  size = 24,
  color = "currentColor",
  className,
  ...props
}: LocationPinProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 text-accent", className)}
      {...props}
    >
      <title>Location</title>
      <path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
        fill={color}
      />
      <circle cx="12" cy="9" r="2.5" fill="white" />
    </svg>
  );
}

interface MapMarkerProps {
  label?: string;
  price?: string;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function MapMarker({
  label,
  price,
  isSelected = false,
  onClick,
  className,
}: MapMarkerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center transition-transform hover:scale-110",
        isSelected && "scale-110 z-10",
        className,
      )}
    >
      <LocationPin
        size={isSelected ? 40 : 32}
        className={cn(
          "drop-shadow-md transition-all",
          isSelected ? "text-primary" : "text-accent",
        )}
      />
      {(label || price) && (
        <div
          className={cn(
            "absolute -bottom-6 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium shadow-md",
            isSelected
              ? "bg-primary text-primary-foreground"
              : "bg-card text-card-foreground border",
          )}
        >
          {price || label}
        </div>
      )}
    </button>
  );
}
