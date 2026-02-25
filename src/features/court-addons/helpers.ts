import { formatCurrency } from "@/common/format";
import type {
  CourtAddonForm,
  CourtAddonRuleForm,
  SelectedAddon,
} from "./schemas";

// UI-layer only — never serialized to DB or API
export type AddonRuleGroup = {
  _id: string;
  days: number[];
  startMinute: number;
  endMinute: number;
  hourlyRateCents: number | null;
};

export function collapseRulesToGroups(
  rules: CourtAddonRuleForm[],
): AddonRuleGroup[] {
  const groupMap = new Map<string, AddonRuleGroup>();

  for (const rule of rules) {
    const key = JSON.stringify([
      rule.startMinute,
      rule.endMinute,
      rule.hourlyRateCents ?? "flat",
    ]);

    const existing = groupMap.get(key);
    if (existing) {
      existing.days.push(rule.dayOfWeek);
    } else {
      groupMap.set(key, {
        _id: crypto.randomUUID(),
        days: [rule.dayOfWeek],
        startMinute: rule.startMinute,
        endMinute: rule.endMinute,
        hourlyRateCents: rule.hourlyRateCents ?? null,
      });
    }
  }

  return Array.from(groupMap.values());
}

export function expandGroupsToRules(
  groups: AddonRuleGroup[],
): CourtAddonRuleForm[] {
  const rules: CourtAddonRuleForm[] = [];

  for (const group of groups) {
    for (const day of group.days) {
      rules.push({
        dayOfWeek: day,
        startMinute: group.startMinute,
        endMinute: group.endMinute,
        hourlyRateCents: group.hourlyRateCents ?? undefined,
      });
    }
  }

  return rules;
}

export type CourtAddonConfig = {
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
      displayOrder: config.addon.displayOrder ?? index,
      rules: sortCourtAddonRules(config.rules).map((rule) => ({
        dayOfWeek: rule.dayOfWeek,
        startMinute: rule.startMinute,
        endMinute: rule.endMinute,
        hourlyRateCents: rule.hourlyRateCents ?? undefined,
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

export function sanitizeSelectedAddons(
  selectedAddons: SelectedAddon[],
  configs: CourtAddonConfig[],
): SelectedAddon[] {
  const allowedIds = new Set(
    configs
      .filter((config) => config.addon.isActive)
      .map((config) => config.addon.id),
  );
  const seen = new Map<string, SelectedAddon>();
  for (const entry of selectedAddons) {
    if (allowedIds.has(entry.addonId)) {
      seen.set(entry.addonId, entry);
    }
  }
  return Array.from(seen.values());
}

export function formatAddonPricingHint(config: CourtAddonConfig) {
  if (config.addon.pricingType === "FLAT") {
    if (config.addon.flatFeeCents != null && config.addon.flatFeeCents > 0) {
      return `${formatCurrency(config.addon.flatFeeCents)} per booking`;
    }
    return "Charged once per booking";
  }

  const rates = config.rules
    .map((r) => r.hourlyRateCents)
    .filter((c): c is number => c != null && c > 0);

  if (rates.length === 0) {
    return "Charged per booked hour";
  }

  const min = Math.min(...rates);
  const max = Math.max(...rates);

  if (min === max) {
    return `${formatCurrency(min)}/hr`;
  }
  return `From ${formatCurrency(min)}/hr`;
}

function compareAddonConfigsByDisplayOrder(
  left: CourtAddonConfig,
  right: CourtAddonConfig,
) {
  if (left.addon.displayOrder !== right.addon.displayOrder) {
    return left.addon.displayOrder - right.addon.displayOrder;
  }
  const labelCompare = left.addon.label.localeCompare(right.addon.label);
  if (labelCompare !== 0) {
    return labelCompare;
  }
  return left.addon.id.localeCompare(right.addon.id);
}

export function mergeAddonConfigs(options: {
  globalAddons: CourtAddonConfig[];
  courtAddons: CourtAddonConfig[];
}) {
  const sortedGlobal = [...options.globalAddons].sort(
    compareAddonConfigsByDisplayOrder,
  );
  const sortedCourt = [...options.courtAddons].sort(
    compareAddonConfigsByDisplayOrder,
  );
  const globalAddonIds = new Set(sortedGlobal.map((config) => config.addon.id));
  return {
    addons: [...sortedGlobal, ...sortedCourt],
    globalAddonIds,
  };
}

export function partitionAddonsByScope<
  T extends { scope: "GLOBAL" | "SPECIFIC" },
>(addons: T[]): { global: T[]; specific: T[] } {
  const global: T[] = [];
  const specific: T[] = [];
  for (const addon of addons) {
    if (addon.scope === "GLOBAL") global.push(addon);
    else specific.push(addon);
  }
  return { global, specific };
}

export function formatPricingWarningMessage(message: string) {
  return message.trim().length > 0
    ? message
    : "Some auto-applied extras were not applied for all selected hours.";
}
