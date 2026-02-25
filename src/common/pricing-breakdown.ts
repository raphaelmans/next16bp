export type AddonPricingType = "HOURLY" | "FLAT";

export type PricingBreakdownAddonLine = {
  addonId: string;
  addonLabel: string;
  pricingType: AddonPricingType;
  quantity: number;
  subtotalCents: number;
};

export type PricingBreakdown = {
  basePriceCents: number;
  addonPriceCents: number;
  totalPriceCents: number;
  addons: PricingBreakdownAddonLine[];
};
