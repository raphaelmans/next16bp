const nonDialableRegex = /[^\d+]/g;

const cleanPhoneValue = (value: string) => value.replace(nonDialableRegex, "");

export const toDialablePhone = (value: string): string => {
  const cleaned = cleanPhoneValue(value);
  if (!cleaned) return "";
  return cleaned.startsWith("00") ? `+${cleaned.slice(2)}` : cleaned;
};

export const normalizePhMobile = (value: string): string => {
  const cleaned = cleanPhoneValue(value);
  if (!cleaned) return "";
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("63")) return `+${cleaned}`;
  if (cleaned.startsWith("09")) return `+63${cleaned.slice(1)}`;
  return cleaned;
};

export const buildViberDeepLink = (value: string): string => {
  const normalized = normalizePhMobile(value);
  if (!normalized) return "";
  return `viber://chat?number=${encodeURIComponent(normalized)}`;
};
