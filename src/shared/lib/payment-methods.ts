export const PAYMENT_METHOD_TYPES = ["MOBILE_WALLET", "BANK"] as const;

export const MOBILE_WALLET_PROVIDERS = ["GCASH", "MAYA"] as const;

export const BANK_PROVIDERS = [
  "BPI",
  "BDO",
  "METROBANK",
  "UNIONBANK",
  "RCBC",
  "LANDBANK",
  "SECURITY_BANK",
  "CHINABANK",
  "PNB",
  "EASTWEST",
] as const;

export const PAYMENT_METHOD_PROVIDERS = [
  ...MOBILE_WALLET_PROVIDERS,
  ...BANK_PROVIDERS,
] as const;

export type PaymentMethodType = (typeof PAYMENT_METHOD_TYPES)[number];
export type PaymentMethodProvider = (typeof PAYMENT_METHOD_PROVIDERS)[number];

export const PAYMENT_METHOD_TYPE_LABELS: Record<PaymentMethodType, string> = {
  MOBILE_WALLET: "Mobile Wallet",
  BANK: "Bank",
};

export const PAYMENT_PROVIDER_LABELS: Record<PaymentMethodProvider, string> = {
  GCASH: "GCash",
  MAYA: "Maya",
  BPI: "BPI",
  BDO: "BDO",
  METROBANK: "Metrobank",
  UNIONBANK: "UnionBank",
  RCBC: "RCBC",
  LANDBANK: "LandBank",
  SECURITY_BANK: "Security Bank",
  CHINABANK: "China Bank",
  PNB: "PNB",
  EASTWEST: "EastWest",
};
