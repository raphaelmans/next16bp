"use client";

import { Loader2 } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  collapseRulesToGroups,
  mapCourtAddonConfigsToForms,
} from "@/features/court-addons/helpers";
import { useQueryOwnerCourtAddons } from "@/features/owner/hooks";
import { cn } from "@/lib/utils";
import type { OwnerCourt } from "../hooks";

type AddonScope = "GLOBAL" | "SPECIFIC";

type CopiedAddonForm = {
  label: string;
  isActive: boolean;
  mode: "OPTIONAL" | "AUTO";
  pricingType: "HOURLY" | "FLAT";
  flatFeeCents?: number | null;
  displayOrder: number;
  groups: {
    days: number[];
    startMinute: number;
    endMinute: number;
    hourlyRateCents: number | null;
  }[];
  scope: AddonScope;
};

interface AddonCopyFromCourtDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courts: OwnerCourt[];
  currentCourtId: string;
  placeId: string;
  onCopy: (addons: CopiedAddonForm[]) => void;
}

export function AddonCopyFromCourtDialog({
  open,
  onOpenChange,
  courts,
  currentCourtId,
  placeId,
  onCopy,
}: AddonCopyFromCourtDialogProps) {
  const [search, setSearch] = React.useState("");
  const [selectedCourtId, setSelectedCourtId] = React.useState<string | null>(
    null,
  );
  const [checkedIds, setCheckedIds] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (!open) {
      setSearch("");
      setSelectedCourtId(null);
      setCheckedIds(new Set());
    }
  }, [open]);

  const { data: sourceAddons, isLoading: addonsLoading } =
    useQueryOwnerCourtAddons(selectedCourtId ?? "", {
      enabled: !!selectedCourtId,
    });

  const sourceAddonForms = React.useMemo(() => {
    if (!sourceAddons) return [];
    return mapCourtAddonConfigsToForms(sourceAddons);
  }, [sourceAddons]);

  // Reset checked when source court changes
  React.useEffect(() => {
    if (sourceAddonForms.length > 0) {
      setCheckedIds(new Set(sourceAddonForms.map((_, i) => String(i))));
    } else {
      setCheckedIds(new Set());
    }
  }, [sourceAddonForms]);

  const siblingCourts = React.useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return courts.filter((court) => {
      if (court.id === currentCourtId) return false;
      if (court.placeId !== placeId) return false;
      if (!normalized) return true;
      const target =
        `${court.label} ${court.sportName} ${court.placeName}`.toLowerCase();
      return target.includes(normalized);
    });
  }, [courts, currentCourtId, placeId, search]);

  const selectedCourt = siblingCourts.find((c) => c.id === selectedCourtId);

  const handleToggle = (index: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleCopy = () => {
    const selected = sourceAddonForms
      .filter((_, i) => checkedIds.has(String(i)))
      .map((form, i) => ({
        label: form.label,
        isActive: form.isActive,
        mode: form.mode,
        pricingType: form.pricingType,
        flatFeeCents: form.flatFeeCents,
        displayOrder: i,
        groups: collapseRulesToGroups(form.rules),
        scope: "SPECIFIC" as const,
      }));
    onCopy(selected);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Copy add-ons from another court</DialogTitle>
          <DialogDescription>
            {selectedCourtId
              ? "Select which add-ons to copy."
              : "Choose a sibling court to copy add-ons from."}
          </DialogDescription>
        </DialogHeader>

        {!selectedCourtId ? (
          <div className="space-y-4">
            <Input
              placeholder="Search courts"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="max-h-64 space-y-2 overflow-auto rounded-md border p-2">
              {siblingCourts.length === 0 ? (
                <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                  No sibling courts available.
                </p>
              ) : (
                siblingCourts.map((court) => (
                  <button
                    key={court.id}
                    type="button"
                    onClick={() => setSelectedCourtId(court.id)}
                    className={cn(
                      "w-full rounded-md border px-3 py-2 text-left text-sm transition",
                      "border-border hover:bg-muted",
                    )}
                  >
                    <div className="font-medium">
                      {court.label} · {court.sportName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {court.placeName}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                From: {selectedCourt?.label}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCourtId(null)}
              >
                Change
              </Button>
            </div>

            {addonsLoading ? (
              <div className="flex min-h-[120px] items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : sourceAddonForms.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                This court has no add-ons.
              </p>
            ) : (
              <div className="max-h-64 space-y-2 overflow-auto rounded-md border p-2">
                {sourceAddonForms.map((form, i) => {
                  const key = String(i);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleToggle(key)}
                      className="flex w-full cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-left text-sm hover:bg-muted"
                    >
                      <Checkbox
                        checked={checkedIds.has(key)}
                        onCheckedChange={() => handleToggle(key)}
                      />
                      <span className="flex-1 font-medium">{form.label}</span>
                      <Badge variant="outline" className="text-xs">
                        {form.mode === "AUTO" ? "Auto" : "Optional"}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {form.pricingType === "FLAT" ? "Flat" : "Hourly"}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {selectedCourtId && (
            <Button
              onClick={handleCopy}
              disabled={checkedIds.size === 0 || addonsLoading}
            >
              Copy selected ({checkedIds.size})
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
