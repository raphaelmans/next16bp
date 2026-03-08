import { appRoutes } from "@/common/app-routes";

export type PopularDiscoveryLink = {
  label: string;
  href: string;
};

export const POPULAR_DISCOVERY_LINKS: PopularDiscoveryLink[] = [
  {
    label: "Pickleball in Cebu City",
    href: appRoutes.courts.locations.sport("cebu", "cebu-city", "pickleball"),
  },
  {
    label: "Badminton in Manila",
    href: appRoutes.courts.locations.city("metro-manila", "manila"),
  },
  {
    label: "Basketball in Quezon City",
    href: appRoutes.courts.locations.city("metro-manila", "quezon-city"),
  },
];
