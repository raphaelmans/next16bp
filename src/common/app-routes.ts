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
  listYourVenue: {
    base: "/list-your-venue",
    options: { type: "public" as const },
  },
  ownersGetStarted: {
    base: "/owners/get-started",
    options: { type: "public" as const },
  },
  courts: {
    base: "/courts",
    options: { type: "public" as const },
    detail: (courtId: string) => `/courts/${courtId}`,
    schedule: (courtId: string) => `/courts/${courtId}/schedule`,
    book: (courtId: string, slotId: string) =>
      `/courts/${courtId}/book/${slotId}`,
    locations: {
      province: (province: string) => `/courts/locations/${province}`,
      city: (province: string, city: string) =>
        `/courts/locations/${province}/${city}`,
      sport: (province: string, city: string, sport: string) =>
        `/courts/locations/${province}/${city}/${sport}`,
    },
  },
  places: {
    base: "/venues",
    options: { type: "public" as const },
    detail: (placeId: string) => `/venues/${placeId}`,
    schedule: (placeId: string) => `/venues/${placeId}/schedule`,
    book: (placeId: string) => `/venues/${placeId}/book`,
    courts: {
      detail: (venueSlugOrId: string, courtId: string) =>
        `/venues/${venueSlugOrId}/courts/${courtId}`,
    },
  },
  login: {
    base: "/login",
    options: { type: "guest" as const },
    from: (path: string) => buildRedirectUrl("/login", path),
  },
  register: {
    base: "/register",
    options: { type: "guest" as const },
    owner: "/register/owner",
  },
  magicLink: {
    base: "/magic-link",
    options: { type: "guest" as const },
  },
  home: {
    base: "/home",
    options: { type: "protected" as const },
  },
  postLogin: {
    base: "/post-login",
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
  contactUs: {
    base: "/contact-us",
    options: { type: "public" as const },
  },
  about: {
    base: "/about",
    options: { type: "public" as const },
  },
  blog: {
    base: "/blog",
    options: { type: "public" as const },
  },
  cookies: {
    base: "/cookies",
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
  openPlay: {
    base: "/open-play",
    options: { type: "public" as const },
    detail: (openPlayId: string) => `/open-play/${openPlayId}`,
    byPlace: (placeIdOrSlug: string) => `/venues/${placeIdOrSlug}/open-play`,
  },
  account: {
    base: "/account",
    options: { type: "protected" as const },
    profile: "/account/profile",
  },
  owner: {
    base: "/owner",
    options: { type: "owner" as const },
    bookings: "/owner/bookings",
    getStarted: "/owner/get-started",
    onboarding: "/owner/onboarding",
    verify: "/owner/verify",
    verification: {
      base: "/owner/verify",
      place: (placeId: string) => `/owner/verify/${placeId}`,
    },
    courts: {
      base: "/owner/courts",
      setupCreate: "/owner/courts/setup",
      edit: (courtId: string) => `/owner/courts/${courtId}/edit`,
      availability: (courtId: string) =>
        `/owner/courts/${courtId}/availability`,
    },
    places: {
      base: "/owner/venues",
      new: "/owner/venues/new",
      edit: (placeId: string) => `/owner/venues/${placeId}/edit`,
      courts: {
        base: (placeId: string) => `/owner/venues/${placeId}/courts`,
        new: (placeId: string) => `/owner/venues/${placeId}/courts/new`,
        setupCreate: (placeId: string) =>
          `/owner/venues/${placeId}/courts/setup`,
        edit: (placeId: string, courtId: string) =>
          `/owner/venues/${placeId}/courts/${courtId}/edit`,
        setup: (placeId: string, courtId: string, step?: string) => {
          const params = new URLSearchParams({ courtId });
          if (step) {
            params.set("step", step);
          }
          return `/owner/venues/${placeId}/courts/setup?${params.toString()}`;
        },
        schedule: (placeId: string, courtId: string) =>
          `/owner/venues/${placeId}/courts/${courtId}/schedule`,
        hours: (placeId: string, courtId: string) =>
          `/owner/venues/${placeId}/courts/${courtId}/hours`,
        pricing: (placeId: string, courtId: string) =>
          `/owner/venues/${placeId}/courts/${courtId}/pricing`,
        availability: (placeId: string, courtId: string) =>
          `/owner/venues/${placeId}/courts/${courtId}/availability`,
      },
    },
    imports: {
      base: "/owner/import",
      bookings: "/owner/import/bookings",
      bookingsReview: (jobId: string) => `/owner/import/bookings/${jobId}`,
    },
    reservations: "/owner/reservations",
    reservationsActive: "/owner/reservations/active",
    reservationDetail: (reservationId: string) =>
      `/owner/reservations/${reservationId}`,
    reservationGroupDetail: (reservationGroupId: string) =>
      `/owner/reservations/group/${reservationGroupId}`,
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
      batch: "/admin/courts/batch",
      detail: (courtId: string) => `/admin/courts/${courtId}`,
    },
    venues: {
      base: "/admin/venues",
    },
    placeVerification: {
      base: "/admin/verification",
      detail: (requestId: string) => `/admin/verification/${requestId}`,
    },
  },
} satisfies Record<string, RouteConfig | Record<string, unknown>>;

const bookingRoutePattern =
  /^\/(courts\/[^/]+\/book\/[^/]+|venues\/[^/]+\/book|places\/[^/]+\/book)$/;

const exactOrChild = (path: string, base: string) =>
  path === base || path.startsWith(`${base}/`);

const protectedBases = [
  appRoutes.home.base,
  appRoutes.postLogin.base,
  appRoutes.dashboard.base,
  appRoutes.reservations.base,
  appRoutes.account.base,
  appRoutes.owner.onboarding,
  appRoutes.owner.getStarted,
];

const guestBases = [
  appRoutes.login.base,
  appRoutes.register.base,
  appRoutes.magicLink.base,
];

const publicBases = [
  appRoutes.index.base,
  appRoutes.listYourVenue.base,
  appRoutes.ownersGetStarted.base,
  appRoutes.courts.base,
  appRoutes.places.base,
  appRoutes.openPlay.base,
  appRoutes.terms.base,
  appRoutes.privacy.base,
  appRoutes.contactUs.base,
  appRoutes.about.base,
  appRoutes.blog.base,
  appRoutes.cookies.base,
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
