import { inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/lib/shared/infra/db/schema";

const main = async () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const client = postgres(connectionString);
  const db = drizzle(client, { schema });

  try {
    const addons = await db.select().from(schema.courtAddon);
    const addonRules = await db.select().from(schema.courtAddonRateRule);

    const rulesByAddonId = new Map<string, typeof addonRules>();
    for (const rule of addonRules) {
      const list = rulesByAddonId.get(rule.addonId) ?? [];
      list.push(rule);
      rulesByAddonId.set(rule.addonId, list);
    }

    const invalidFlat = addons.filter(
      (addon) =>
        addon.pricingType === "FLAT" &&
        (addon.flatFeeCents === null || addon.flatFeeCurrency === null),
    );

    const invalidHourly = addons.filter((addon) => {
      if (addon.pricingType !== "HOURLY") return false;
      const rules = rulesByAddonId.get(addon.id) ?? [];
      return (
        rules.length === 0 ||
        rules.some(
          (rule) => rule.hourlyRateCents === null || rule.currency === null,
        )
      );
    });

    const overlapViolations: Array<{
      addonId: string;
      dayOfWeek: number;
      firstRuleId: string;
      secondRuleId: string;
    }> = [];

    for (const addon of addons) {
      const rules = rulesByAddonId.get(addon.id) ?? [];
      const byDay = new Map<number, typeof rules>();
      for (const rule of rules) {
        const list = byDay.get(rule.dayOfWeek) ?? [];
        list.push(rule);
        byDay.set(rule.dayOfWeek, list);
      }

      for (const [dayOfWeek, dayRules] of byDay.entries()) {
        const sorted = [...dayRules].sort(
          (a, b) => a.startMinute - b.startMinute,
        );
        for (let i = 1; i < sorted.length; i++) {
          if (sorted[i].startMinute < sorted[i - 1].endMinute) {
            overlapViolations.push({
              addonId: addon.id,
              dayOfWeek,
              firstRuleId: sorted[i - 1].id,
              secondRuleId: sorted[i].id,
            });
          }
        }
      }
    }

    const courtIds = Array.from(new Set(addons.map((addon) => addon.courtId)));
    const baseRules =
      courtIds.length === 0
        ? []
        : await db
            .select()
            .from(schema.courtRateRule)
            .where(inArray(schema.courtRateRule.courtId, courtIds));

    const baseCurrenciesByCourt = new Map<string, Set<string>>();
    for (const rule of baseRules) {
      const set = baseCurrenciesByCourt.get(rule.courtId) ?? new Set<string>();
      set.add(rule.currency);
      baseCurrenciesByCourt.set(rule.courtId, set);
    }

    const currencyMismatches: Array<{
      addonId: string;
      addonLabel: string;
      addonCurrency: string;
      courtId: string;
    }> = [];

    for (const addon of addons) {
      const baseCurrencies = baseCurrenciesByCourt.get(addon.courtId);
      if (!baseCurrencies || baseCurrencies.size === 0) {
        continue;
      }

      if (addon.pricingType === "FLAT" && addon.flatFeeCurrency) {
        if (!baseCurrencies.has(addon.flatFeeCurrency)) {
          currencyMismatches.push({
            addonId: addon.id,
            addonLabel: addon.label,
            addonCurrency: addon.flatFeeCurrency,
            courtId: addon.courtId,
          });
        }
      }

      if (addon.pricingType === "HOURLY") {
        const rules = rulesByAddonId.get(addon.id) ?? [];
        for (const rule of rules) {
          if (rule.currency && !baseCurrencies.has(rule.currency)) {
            currencyMismatches.push({
              addonId: addon.id,
              addonLabel: addon.label,
              addonCurrency: rule.currency,
              courtId: addon.courtId,
            });
          }
        }
      }
    }

    const summary = {
      totalAddons: addons.length,
      totalAddonRules: addonRules.length,
      invalidFlatCount: invalidFlat.length,
      invalidHourlyCount: invalidHourly.length,
      overlapViolationCount: overlapViolations.length,
      currencyMismatchCount: currencyMismatches.length,
    };

    console.info(JSON.stringify({ summary }, null, 2));

    if (
      invalidFlat.length > 0 ||
      invalidHourly.length > 0 ||
      overlapViolations.length > 0 ||
      currencyMismatches.length > 0
    ) {
      throw new Error(
        "Addon pricing migration validation failed. Inspect counts in summary output.",
      );
    }
  } finally {
    await client.end();
  }
};

main().catch((error) => {
  console.error("Addon pricing migration validation failed", error);
  process.exit(1);
});
