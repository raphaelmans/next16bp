"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { OwnerCourt } from "../hooks";

interface CourtConfigCopyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  courts: OwnerCourt[];
  currentCourtId: string;
  isSubmitting?: boolean;
  confirmLabel?: string;
  onConfirm: (sourceCourtId: string) => void;
}

export function CourtConfigCopyDialog({
  open,
  onOpenChange,
  title,
  description,
  courts,
  currentCourtId,
  isSubmitting,
  confirmLabel = "Copy & Replace",
  onConfirm,
}: CourtConfigCopyDialogProps) {
  const [search, setSearch] = React.useState("");
  const [selectedCourtId, setSelectedCourtId] = React.useState<string | null>(
    null,
  );

  React.useEffect(() => {
    if (!open) {
      setSearch("");
      setSelectedCourtId(null);
    }
  }, [open]);

  const filteredCourts = React.useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return courts.filter((court) => {
      if (court.id === currentCourtId) return false;
      if (!normalized) return true;
      const target =
        `${court.label} ${court.sportName} ${court.placeName} ${court.city}`.toLowerCase();
      return target.includes(normalized);
    });
  }, [courts, currentCourtId, search]);

  const selectedCourt = filteredCourts.find(
    (court) => court.id === selectedCourtId,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Search courts"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <div className="max-h-64 space-y-2 overflow-auto rounded-md border p-2">
            {filteredCourts.length === 0 ? (
              <p className="text-sm text-muted-foreground px-2 py-6 text-center">
                No courts available to copy from.
              </p>
            ) : (
              filteredCourts.map((court) => {
                const isSelected = court.id === selectedCourtId;
                return (
                  <button
                    key={court.id}
                    type="button"
                    onClick={() => setSelectedCourtId(court.id)}
                    className={cn(
                      "w-full rounded-md border px-3 py-2 text-left text-sm transition",
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-muted",
                    )}
                  >
                    <div className="font-medium">
                      {court.label} · {court.sportName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {court.placeName} · {court.city}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {selectedCourt && (
            <p className="text-xs text-muted-foreground">
              Copying from <strong>{selectedCourt.label}</strong> will replace
              the current configuration for this court.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => selectedCourtId && onConfirm(selectedCourtId)}
            disabled={!selectedCourtId || isSubmitting}
          >
            {isSubmitting ? "Copying..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
