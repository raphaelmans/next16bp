export const SETTINGS_SECTION_IDS = {
  organizationProfile: "organization-profile",
  contactInformation: "contact-information",
  paymentMethods: "payment-methods",
  dangerZone: "danger-zone",
} as const;

export const SETTINGS_SECTION_HASHES = {
  organizationProfile: `#${SETTINGS_SECTION_IDS.organizationProfile}`,
  contactInformation: `#${SETTINGS_SECTION_IDS.contactInformation}`,
  paymentMethods: `#${SETTINGS_SECTION_IDS.paymentMethods}`,
  dangerZone: `#${SETTINGS_SECTION_IDS.dangerZone}`,
} as const;

export type SettingsSectionId =
  (typeof SETTINGS_SECTION_IDS)[keyof typeof SETTINGS_SECTION_IDS];
