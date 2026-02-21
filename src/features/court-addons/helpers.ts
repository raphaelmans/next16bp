import type { CourtAddonForm } from "./schemas";

export type CourtAddonConfig = {
  addon: {
    id: string;
    label: string;
    isActive: boolean;
    mode: "OPTIONAL" | "AUTO";
    pricingType: "HOURLY" | "FLAT";
    flatFeeCents: number | null;
    flatFeeCurrency: string | null;
    displayOrder: number;
  };
  rules: {
    dayOfWeek: number;
    startMinute: number;
    endMinute: number;
    hourlyRateCents: number | null;
    currency: string | null;
  }[];
};

export function sortCourtAddonRules(rules: CourtAddonConfig["rules"]) {
  return [...rules].sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) {
      return a.dayOfWeek - b.dayOfWeek;
    }
    if (a.startMinute !== b.startMinute) {
      return a.startMinute - b.startMinute;
    }
    return a.endMinute - b.endMinute;
  });
}

export function mapCourtAddonConfigsToForms(
  configs: CourtAddonConfig[],
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
      flatFeeCurrency: config.addon.flatFeeCurrency,
      displayOrder: config.addon.displayOrder ?? index,
      rules: sortCourtAddonRules(config.rules).map((rule) => ({
        dayOfWeek: rule.dayOfWeek,
        startMinute: rule.startMinute,
        endMinute: rule.endMinute,
        hourlyRateCents: rule.hourlyRateCents ?? undefined,
        currency: rule.currency ?? undefined,
      })),
    }));
}

export function mapCourtAddonFormsToSetPayload(
  courtId: string,
  forms: CourtAddonForm[],
) {
  return {
    courtId,
    addons: forms.map((form, index) => ({
      label: form.label,
      isActive: form.isActive,
      mode: form.mode,
      pricingType: form.pricingType,
      flatFeeCents:
        form.pricingType === "FLAT"
          ? (form.flatFeeCents ?? undefined)
          : undefined,
      flatFeeCurrency:
        form.pricingType === "FLAT"
          ? (form.flatFeeCurrency ?? undefined)
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
        currency:
          form.pricingType === "HOURLY"
            ? (rule.currency ?? undefined)
            : undefined,
      })),
    })),
  };
}

export function getAutoAddonIds(configs: CourtAddonConfig[]) {
  return configs
    .filter((config) => config.addon.isActive && config.addon.mode === "AUTO")
    .map((config) => config.addon.id);
}

export function getOptionalAddonConfigs(configs: CourtAddonConfig[]) {
  return configs.filter(
    (config) => config.addon.isActive && config.addon.mode === "OPTIONAL",
  );
}

export function sanitizeSelectedAddonIds(
  selectedAddonIds: string[],
  configs: CourtAddonConfig[],
) {
  const allowedIds = new Set(
    configs
      .filter((config) => config.addon.isActive)
      .map((config) => config.addon.id),
  );
  return Array.from(
    new Set(selectedAddonIds.filter((addonId) => allowedIds.has(addonId))),
  );
}

export function formatAddonPricingHint(config: CourtAddonConfig) {
  if (config.addon.pricingType === "FLAT") {
    return "Charged once per booking";
  }
  return "Charged per booked hour";
}

export function formatPricingWarningMessage(message: string) {
  return message.trim().length > 0
    ? message
    : "Some auto-applied extras were not applied for all selected hours.";
}
