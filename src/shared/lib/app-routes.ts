export type RouteType = "public" | "guest" | "protected" | "owner" | "admin";

type RouteOptions = {
  type: RouteType;
};

type RouteConfig = {
  base: string;
  options: RouteOptions;
};

const buildRedirectUrl = (base: string, path: string) => {
  const params = new URLSearchParams({ redirect: path });
  return `${base}?${params.toString()}`;
};

export const appRoutes = {
  index: {
    base: "/",
    options: { type: "public" as const },
  },
  courts: {
    base: "/courts",
    options: { type: "public" as const },
    detail: (courtId: string) => `/courts/${courtId}`,
    book: (courtId: string, slotId: string) =>
      `/courts/${courtId}/book/${slotId}`,
  },
  places: {
    base: "/places",
    options: { type: "public" as const },
    detail: (placeId: string) => `/places/${placeId}`,
    book: (placeId: string) => `/places/${placeId}/book`,
  },
  login: {
    base: "/login",
    options: { type: "guest" as const },
    from: (path: string) => buildRedirectUrl("/login", path),
  },
  register: {
    base: "/register",
    options: { type: "guest" as const },
  },
  magicLink: {
    base: "/magic-link",
    options: { type: "guest" as const },
  },
  home: {
    base: "/home",
    options: { type: "protected" as const },
  },
  terms: {
    base: "/terms",
    options: { type: "public" as const },
  },
  privacy: {
    base: "/privacy",
    options: { type: "public" as const },
  },
  dashboard: {
    base: "/dashboard",
    options: { type: "protected" as const },
  },
  reservations: {
    base: "/reservations",
    options: { type: "protected" as const },
    detail: (reservationId: string) => `/reservations/${reservationId}`,
    payment: (reservationId: string) =>
      `/reservations/${reservationId}/payment`,
  },
  account: {
    base: "/account",
    options: { type: "protected" as const },
    profile: "/account/profile",
  },
  owner: {
    base: "/owner",
    options: { type: "owner" as const },
    onboarding: "/owner/onboarding",
    pricing: "/owner/pricing",
    verify: "/owner/verify",
    courts: {
      base: "/owner/courts",
      new: "/owner/courts/new",
      edit: (courtId: string) => `/owner/courts/${courtId}/edit`,
      slots: (courtId: string) => `/owner/courts/${courtId}/slots`,
    },
    places: {
      base: "/owner/places",
      new: "/owner/places/new",
      edit: (placeId: string) => `/owner/places/${placeId}/edit`,
      courts: {
        base: (placeId: string) => `/owner/places/${placeId}/courts`,
        new: (placeId: string) => `/owner/places/${placeId}/courts/new`,
        edit: (placeId: string, courtId: string) =>
          `/owner/places/${placeId}/courts/${courtId}/edit`,
        hours: (placeId: string, courtId: string) =>
          `/owner/places/${placeId}/courts/${courtId}/hours`,
        pricing: (placeId: string, courtId: string) =>
          `/owner/places/${placeId}/courts/${courtId}/pricing`,
        slots: (placeId: string, courtId: string) =>
          `/owner/places/${placeId}/courts/${courtId}/slots`,
      },
    },
    reservations: "/owner/reservations",
    reservationsActive: "/owner/reservations/active",
    reservationDetail: (reservationId: string) =>
      `/owner/reservations/${reservationId}`,
    settings: "/owner/settings",
  },
  admin: {
    base: "/admin",
    options: { type: "admin" as const },
    claims: {
      base: "/admin/claims",
      detail: (claimId: string) => `/admin/claims/${claimId}`,
    },
    courts: {
      base: "/admin/courts",
      new: "/admin/courts/new",
      detail: (courtId: string) => `/admin/courts/${courtId}`,
    },
  },
} satisfies Record<string, RouteConfig | Record<string, unknown>>;

const bookingRoutePattern =
  /^\/(courts\/[^/]+\/book\/[^/]+|places\/[^/]+\/book)$/;

const exactOrChild = (path: string, base: string) =>
  path === base || path.startsWith(`${base}/`);

const protectedBases = [
  appRoutes.home.base,
  appRoutes.dashboard.base,
  appRoutes.reservations.base,
  appRoutes.account.base,
  appRoutes.owner.onboarding,
];

const guestBases = [
  appRoutes.login.base,
  appRoutes.register.base,
  appRoutes.magicLink.base,
];

const publicBases = [
  appRoutes.index.base,
  appRoutes.courts.base,
  appRoutes.places.base,
  appRoutes.terms.base,
  appRoutes.privacy.base,
];

export const routeGroups = {
  public: publicBases,
  guest: guestBases,
  protected: protectedBases,
  owner: [appRoutes.owner.base],
  admin: [appRoutes.admin.base],
};

export const routePatterns = {
  booking: bookingRoutePattern,
};

export const matchesRoute = (path: string, base: string) =>
  exactOrChild(path, base);

export function getRouteType(pathname: string): RouteType {
  if (routePatterns.booking.test(pathname)) {
    return "protected";
  }

  if (routeGroups.admin.some((route) => exactOrChild(pathname, route))) {
    return "admin";
  }

  if (routeGroups.owner.some((route) => exactOrChild(pathname, route))) {
    return "owner";
  }

  if (routeGroups.protected.some((route) => exactOrChild(pathname, route))) {
    return "protected";
  }

  if (routeGroups.guest.some((route) => exactOrChild(pathname, route))) {
    return "guest";
  }

  if (routeGroups.public.some((route) => exactOrChild(pathname, route))) {
    return "public";
  }

  return "public";
}

export const isProtectedRoute = (pathname: string) => {
  const type = getRouteType(pathname);
  return type === "protected" || type === "owner" || type === "admin";
};

export const isGuestRoute = (pathname: string) =>
  getRouteType(pathname) === "guest";
