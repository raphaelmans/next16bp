export type RouteType =
  | "public"
  | "guest"
  | "protected"
  | "organization"
  | "admin";

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
    reviews: (placeIdOrSlug: string) => `/venues/${placeIdOrSlug}/reviews`,
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
  guides: {
    base: "/guides",
    options: { type: "public" as const },
    detail: (slug: string) => `/guides/${slug}`,
  },
  cookies: {
    base: "/cookies",
    options: { type: "public" as const },
  },
  dashboard: {
    base: "/dashboard",
    options: { type: "protected" as const },
  },
  submitVenue: {
    base: "/submit-venue",
    options: { type: "protected" as const },
  },
  mySubmissions: {
    base: "/my-submissions",
    options: { type: "protected" as const },
  },
  savedVenues: {
    base: "/saved-venues",
    options: { type: "protected" as const },
  },
  reservations: {
    base: "/reservations",
    options: { type: "protected" as const },
    detail: (reservationId: string) => `/reservations/${reservationId}`,
  },
  openPlay: {
    base: "/open-play",
    options: { type: "public" as const },
    detail: (openPlayId: string) => `/open-play/${openPlayId}`,
    externalDetail: (externalOpenPlayId: string) =>
      `/open-play/external/${externalOpenPlayId}`,
    byPlace: (placeIdOrSlug: string) => `/venues/${placeIdOrSlug}/open-play`,
  },
  account: {
    base: "/account",
    options: { type: "protected" as const },
    profile: "/account/profile",
    invitations: {
      accept: "/account/invitations/accept",
    },
  },
  organization: {
    base: "/organization",
    options: { type: "organization" as const },
    bookings: "/organization/bookings",
    getStarted: "/organization/get-started",
    onboarding: "/organization/onboarding",
    verify: "/organization/verify",
    verification: {
      base: "/organization/verify",
      place: (placeId: string) => `/organization/verify/${placeId}`,
    },
    courts: {
      base: "/organization/courts",
      setupCreate: "/organization/courts/setup",
      edit: (courtId: string) => `/organization/courts/${courtId}/edit`,
      availability: (courtId: string) =>
        `/organization/courts/${courtId}/availability`,
    },
    places: {
      base: "/organization/venues",
      new: "/organization/venues/new",
      edit: (placeId: string) => `/organization/venues/${placeId}/edit`,
      courts: {
        base: (placeId: string) => `/organization/venues/${placeId}/courts`,
        new: (placeId: string) => `/organization/venues/${placeId}/courts/new`,
        setupCreate: (placeId: string) =>
          `/organization/venues/${placeId}/courts/setup`,
        edit: (placeId: string, courtId: string) =>
          `/organization/venues/${placeId}/courts/${courtId}/edit`,
        setup: (placeId: string, courtId: string, step?: string) => {
          const params = new URLSearchParams({ courtId });
          if (step) {
            params.set("step", step);
          }
          return `/organization/venues/${placeId}/courts/setup?${params.toString()}`;
        },
        schedule: (placeId: string, courtId: string) =>
          `/organization/venues/${placeId}/courts/${courtId}/schedule`,
        hours: (placeId: string, courtId: string) =>
          `/organization/venues/${placeId}/courts/${courtId}/hours`,
        pricing: (placeId: string, courtId: string) =>
          `/organization/venues/${placeId}/courts/${courtId}/pricing`,
        availability: (placeId: string, courtId: string) =>
          `/organization/venues/${placeId}/courts/${courtId}/availability`,
      },
    },
    imports: {
      base: "/organization/import",
      bookings: "/organization/import/bookings",
      bookingsReview: (jobId: string) =>
        `/organization/import/bookings/${jobId}`,
    },
    reservations: "/organization/reservations",
    reservationsActive: "/organization/reservations/active",
    reservationDetail: (reservationId: string) =>
      `/organization/reservations/${reservationId}`,
    reservationGroupDetail: (reservationGroupId: string) =>
      `/organization/reservations/group/${reservationGroupId}`,
    settings: "/organization/settings",
    team: "/organization/team",
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
    reviews: {
      base: "/admin/reviews",
    },
    submissions: {
      base: "/admin/submissions",
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
  appRoutes.savedVenues.base,
  appRoutes.reservations.base,
  appRoutes.account.base,
  appRoutes.organization.onboarding,
  appRoutes.organization.getStarted,
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
  organization: [appRoutes.organization.base],
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

  if (routeGroups.organization.some((route) => exactOrChild(pathname, route))) {
    return "organization";
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
  return type === "protected" || type === "organization" || type === "admin";
};

export const isGuestRoute = (pathname: string) =>
  getRouteType(pathname) === "guest";
