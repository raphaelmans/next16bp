"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  type CourtAddonConfig,
  formatAddonPricingHint,
  getOptionalAddonConfigs,
} from "../helpers";

type PlayerAddonSelectorProps = {
  addons: CourtAddonConfig[];
  selectedAddonIds: string[];
  onSelectedAddonIdsChange: (next: string[]) => void;
};

export function PlayerAddonSelector({
  addons,
  selectedAddonIds,
  onSelectedAddonIdsChange,
}: PlayerAddonSelectorProps) {
  const optionalAddons = getOptionalAddonConfigs(addons);

  if (optionalAddons.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No optional extras are available for this court.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {optionalAddons.map((config) => {
        const isSelected = selectedAddonIds.includes(config.addon.id);
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
                  const isChecked = checked === true;
                  const next = isChecked
                    ? [...selectedAddonIds, config.addon.id]
                    : selectedAddonIds.filter((id) => id !== config.addon.id);
                  onSelectedAddonIdsChange(next);
                }}
              />
              <Label
                htmlFor={`addon-${config.addon.id}`}
                className="cursor-pointer space-y-1"
              >
                <span className="block text-sm font-medium">
                  {config.addon.label}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {formatAddonPricingHint(config)}
                </span>
              </Label>
            </div>
          </div>
        );
      })}
    </div>
  );
}
