"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  type CourtAddonConfig,
  formatAddonPricingHint,
  getOptionalAddonConfigs,
} from "../helpers";
import type { SelectedAddon } from "../schemas";

type PlayerAddonSelectorProps = {
  addons: CourtAddonConfig[];
  selectedAddons: SelectedAddon[];
  onSelectedAddonsChange: (next: SelectedAddon[]) => void;
};

export function PlayerAddonSelector({
  addons,
  selectedAddons,
  onSelectedAddonsChange,
}: PlayerAddonSelectorProps) {
  const optionalAddons = getOptionalAddonConfigs(addons);

  if (optionalAddons.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No optional extras are available for this court.
      </p>
    );
  }

  const selectedMap = new Map(
    selectedAddons.map((a) => [a.addonId, a.quantity]),
  );

  const handleToggle = (addonId: string, checked: boolean) => {
    if (checked) {
      onSelectedAddonsChange([...selectedAddons, { addonId, quantity: 1 }]);
    } else {
      onSelectedAddonsChange(
        selectedAddons.filter((a) => a.addonId !== addonId),
      );
    }
  };

  const handleQuantityChange = (addonId: string, delta: number) => {
    onSelectedAddonsChange(
      selectedAddons.map((a) =>
        a.addonId === addonId
          ? { ...a, quantity: Math.max(1, a.quantity + delta) }
          : a,
      ),
    );
  };

  return (
    <div className="space-y-3">
      {optionalAddons.map((config) => {
        const qty = selectedMap.get(config.addon.id);
        const isSelected = qty !== undefined;
        return (
          <div
            key={config.addon.id}
            className="rounded-md border px-3 py-2 transition-colors"
          >
            <div className="flex items-start gap-3">
              <Checkbox
                id={`addon-${config.addon.id}`}
                checked={isSelected}
                onCheckedChange={(checked) => {
                  handleToggle(config.addon.id, checked === true);
                }}
              />
              <Label
                htmlFor={`addon-${config.addon.id}`}
                className="flex-1 cursor-pointer space-y-1"
              >
                <span className="block text-sm font-medium">
                  {config.addon.label}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {formatAddonPricingHint(config)}
                </span>
              </Label>
              {isSelected && (
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleQuantityChange(config.addon.id, -1)}
                    disabled={(qty ?? 1) <= 1}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center text-sm tabular-nums">
                    {qty ?? 1}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleQuantityChange(config.addon.id, 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
