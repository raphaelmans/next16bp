"use client";

import { MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@/common/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface CourtCardCourt {
  id: string;
  name: string;
  address: string;
  city: string;
  coverImageUrl?: string;
  type: "CURATED" | "RESERVABLE";
  isFree?: boolean;
  pricePerHourCents?: number;
  currency?: string;
}

export interface CourtCardPhoto {
  url: string;
  alt?: string;
}

interface CourtCardProps {
  court: CourtCardCourt;
  photo?: CourtCardPhoto;
  variant?: "default" | "featured" | "compact";
  showPrice?: boolean;
  showCTA?: boolean;
  className?: string;
}

export function CourtCard({
  court,
  photo,
  variant = "default",
  showPrice = true,
  showCTA = true,
  className,
}: CourtCardProps) {
  const imageUrl = photo?.url || court.coverImageUrl;
  const aspectRatio = variant === "featured" ? "aspect-[4/3]" : "aspect-[16/9]";

  const getBadgeVariant = () => {
    if (court.type === "CURATED") return "outline";
    if (court.isFree) return "success";
    return "paid";
  };

  const getBadgeLabel = () => {
    if (court.type === "CURATED") return "Contact to Book";
    if (court.isFree) return "Free";
    return "Reservable";
  };

  return (
    <Link href={`/courts/${court.id}`} className="group block">
      <Card
        className={cn(
          "overflow-hidden p-0 gap-0",
          variant === "compact" && "flex flex-row",
          className,
        )}
      >
        {/* Image */}
        <div
          className={cn(
            "relative overflow-hidden bg-muted",
            aspectRatio,
            variant === "compact" && "w-24 h-24 shrink-0",
          )}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={photo?.alt || court.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <div className="text-primary/40 font-heading text-2xl">KC</div>
            </div>
          )}

          {/* Badge overlay */}
          <div className="absolute top-2 left-2">
            <Badge variant={getBadgeVariant()} className="text-[10px]">
              {getBadgeLabel()}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className={cn("p-4", variant === "compact" && "flex-1 py-2 px-3")}>
          <h3
            className={cn(
              "font-heading font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors",
              variant === "featured" ? "text-lg" : "text-base",
              variant === "compact" && "text-sm",
            )}
          >
            {court.name}
          </h3>

          <div className="flex items-center gap-1 text-muted-foreground mt-1">
            <MapPin className="h-3 w-3 text-primary shrink-0" />
            <span
              className={cn(
                "line-clamp-1",
                variant === "compact" ? "text-xs" : "text-sm",
              )}
            >
              {court.city}
            </span>
          </div>

          {showPrice &&
            court.type === "RESERVABLE" &&
            !court.isFree &&
            court.pricePerHourCents && (
              <div className="mt-2">
                <span className="font-heading font-bold text-foreground">
                  {formatCurrency(
                    court.pricePerHourCents,
                    court.currency || "PHP",
                  )}
                </span>
                <span className="text-muted-foreground text-sm"> /hour</span>
              </div>
            )}

          {showCTA && variant !== "compact" && (
            <div className="mt-3">
              <Button
                size="sm"
                variant={court.type === "CURATED" ? "outline" : "default"}
                className="w-full"
              >
                {court.type === "CURATED" ? "View Details" : "Book Now"}
              </Button>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}

export function CourtCardSkeleton({
  variant = "default",
}: {
  variant?: "default" | "featured" | "compact";
}) {
  const aspectRatio = variant === "featured" ? "aspect-[4/3]" : "aspect-[16/9]";

  return (
    <Card
      className={cn(
        "overflow-hidden p-0 gap-0 animate-pulse",
        variant === "compact" && "flex flex-row",
      )}
    >
      <div
        className={cn(
          "bg-muted",
          aspectRatio,
          variant === "compact" && "w-24 h-24 shrink-0",
        )}
      />
      <div
        className={cn(
          "p-4 space-y-2",
          variant === "compact" && "flex-1 py-2 px-3",
        )}
      >
        <div className="h-5 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-1/2" />
        {variant !== "compact" && (
          <div className="h-8 bg-muted rounded w-full mt-3" />
        )}
      </div>
    </Card>
  );
}
