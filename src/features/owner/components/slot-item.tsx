"use client";

import { format } from "date-fns";
import {
  Clock,
  User,
  Phone,
  MoreHorizontal,
  Ban,
  Unlock,
  Trash2,
  Eye,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { TimeSlot, SlotStatus } from "../hooks/use-slots";

interface SlotItemProps {
  slot: TimeSlot;
  onBlock?: (slotId: string) => void;
  onUnblock?: (slotId: string) => void;
  onDelete?: (slotId: string) => void;
  onViewBooking?: (slotId: string) => void;
  onConfirm?: (slotId: string) => void;
  onReject?: (slotId: string) => void;
  isLoading?: boolean;
}

const statusConfig: Record<
  SlotStatus,
  { label: string; color: string; dotColor: string }
> = {
  available: {
    label: "Available",
    color: "bg-[#ECFDF5] text-[#059669] border-[#059669]/20",
    dotColor: "bg-[#059669]",
  },
  booked: {
    label: "Booked",
    color: "bg-[#CCFBF1] text-[#0F766E] border-[#0F766E]/20",
    dotColor: "bg-[#0F766E]",
  },
  pending: {
    label: "Pending",
    color: "bg-[#FFFBEB] text-[#D97706] border-[#D97706]/20",
    dotColor: "bg-[#D97706]",
  },
  blocked: {
    label: "Blocked",
    color: "bg-muted text-muted-foreground border-muted",
    dotColor: "bg-muted-foreground",
  },
};

export function SlotItem({
  slot,
  onBlock,
  onUnblock,
  onDelete,
  onViewBooking,
  onConfirm,
  onReject,
  isLoading,
}: SlotItemProps) {
  const startTime = new Date(slot.startTime);
  const endTime = new Date(slot.endTime);
  const config = statusConfig[slot.status];

  const formatPrice = (cents?: number, currency?: string | null) => {
    if (!cents) return null;
    const amount = cents / 100;
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: currency || "PHP",
    }).format(amount);
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 rounded-lg border bg-card transition-colors",
        "hover:bg-muted/50",
      )}
    >
      {/* Time and Duration */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 min-w-[140px]">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">
            {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}
          </span>
        </div>
        <span className="text-sm text-muted-foreground">
          {slot.durationMinutes} min
        </span>
      </div>

      {/* Status and Info */}
      <div className="flex items-center gap-4 flex-1 justify-center">
        <Badge variant="outline" className={cn("gap-1.5", config.color)}>
          <span className={cn("w-2 h-2 rounded-full", config.dotColor)} />
          {config.label}
        </Badge>

        {/* Player info for booked/pending */}
        {(slot.status === "booked" || slot.status === "pending") &&
          slot.playerName && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{slot.playerName}</span>
              </div>
              {slot.playerPhone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{slot.playerPhone}</span>
                </div>
              )}
            </div>
          )}

        {/* Price for available slots */}
        {slot.status === "available" && slot.priceCents && (
          <span className="text-sm font-medium text-primary">
            {formatPrice(slot.priceCents, slot.currency)}
          </span>
        )}

        {/* Payment marked indicator for pending */}
        {slot.status === "pending" && (
          <Badge variant="secondary" className="text-xs">
            Payment marked
          </Badge>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Quick actions for pending */}
        {slot.status === "pending" && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
              onClick={() => onConfirm?.(slot.id)}
              disabled={isLoading}
            >
              <Check className="h-4 w-4 mr-1" />
              Confirm
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => onReject?.(slot.id)}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </>
        )}

        {/* Dropdown menu for other actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={isLoading}>
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {slot.status === "available" && (
              <>
                <DropdownMenuItem onClick={() => onBlock?.(slot.id)}>
                  <Ban className="h-4 w-4 mr-2" />
                  Block Slot
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete?.(slot.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Slot
                </DropdownMenuItem>
              </>
            )}

            {slot.status === "booked" && (
              <DropdownMenuItem onClick={() => onViewBooking?.(slot.id)}>
                <Eye className="h-4 w-4 mr-2" />
                View Booking
              </DropdownMenuItem>
            )}

            {slot.status === "pending" && (
              <DropdownMenuItem onClick={() => onViewBooking?.(slot.id)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
            )}

            {slot.status === "blocked" && (
              <DropdownMenuItem onClick={() => onUnblock?.(slot.id)}>
                <Unlock className="h-4 w-4 mr-2" />
                Unblock Slot
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
