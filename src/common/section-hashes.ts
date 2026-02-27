export const SETTINGS_SECTION_IDS = {
  organizationProfile: "organization-profile",
  contactInformation: "contact-information",
  teamAccess: "team-access",
  browserNotifications: "browser-notifications",
  reservationNotificationRouting: "reservation-notification-routing",
  paymentMethods: "payment-methods",
  dangerZone: "danger-zone",
} as const;

export const SETTINGS_SECTION_HASHES = {
  organizationProfile: `#${SETTINGS_SECTION_IDS.organizationProfile}`,
  contactInformation: `#${SETTINGS_SECTION_IDS.contactInformation}`,
  teamAccess: `#${SETTINGS_SECTION_IDS.teamAccess}`,
  browserNotifications: `#${SETTINGS_SECTION_IDS.browserNotifications}`,
  reservationNotificationRouting: `#${SETTINGS_SECTION_IDS.reservationNotificationRouting}`,
  paymentMethods: `#${SETTINGS_SECTION_IDS.paymentMethods}`,
  dangerZone: `#${SETTINGS_SECTION_IDS.dangerZone}`,
} as const;

export type SettingsSectionId =
  (typeof SETTINGS_SECTION_IDS)[keyof typeof SETTINGS_SECTION_IDS];
