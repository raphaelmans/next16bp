import { sortCourtAddonRules } from "@/features/court-addons/helpers";
import type { CourtAddonForm } from "@/features/court-addons/schemas";

// Re-export shared utilities so importers only need one source
export {
  type AddonRuleGroup,
  collapseRulesToGroups,
  expandGroupsToRules,
} from "@/features/court-addons/helpers";

// PlaceAddonConfig mirrors CourtAddonConfig structurally — same field shapes
export type PlaceAddonConfig = {
  addon: {
    id: string;
    label: string;
    isActive: boolean;
    mode: "OPTIONAL" | "AUTO";
    pricingType: "HOURLY" | "FLAT";
    flatFeeCents: number | null;
    displayOrder: number;
  };
  rules: {
    dayOfWeek: number;
    startMinute: number;
    endMinute: number;
    hourlyRateCents: number | null;
  }[];
};

export function mapPlaceAddonConfigsToForms(
  configs: PlaceAddonConfig[],
): CourtAddonForm[] {
  return [...configs]
    .sort((a, b) => a.addon.displayOrder - b.addon.displayOrder)
    .map((config, index) => ({
      id: config.addon.id,
      label: config.addon.label,
      isActive: config.addon.isActive,
      mode: config.addon.mode,
      pricingType: config.addon.pricingType,
      flatFeeCents: config.addon.flatFeeCents,
      displayOrder: config.addon.displayOrder ?? index,
      rules: sortCourtAddonRules(config.rules).map((rule) => ({
        dayOfWeek: rule.dayOfWeek,
        startMinute: rule.startMinute,
        endMinute: rule.endMinute,
        hourlyRateCents: rule.hourlyRateCents ?? undefined,
      })),
    }));
}

export function mapPlaceAddonFormsToSetPayload(
  placeId: string,
  forms: CourtAddonForm[],
) {
  return {
    placeId,
    addons: forms.map((form, index) => ({
      label: form.label,
      isActive: form.isActive,
      mode: form.mode,
      pricingType: form.pricingType,
      flatFeeCents:
        form.pricingType === "FLAT"
          ? (form.flatFeeCents ?? undefined)
          : undefined,
      displayOrder: form.displayOrder ?? index,
      rules: form.rules.map((rule) => ({
        dayOfWeek: rule.dayOfWeek,
        startMinute: rule.startMinute,
        endMinute: rule.endMinute,
        hourlyRateCents:
          form.pricingType === "HOURLY"
            ? (rule.hourlyRateCents ?? undefined)
            : undefined,
      })),
    })),
  };
}
