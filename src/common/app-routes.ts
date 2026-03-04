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
  postLogin: {
    base: "/post-login",
    options: { type: "protected" as const },
  },
  dashboard: {
    base: "/dashboard",
    options: { type: "protected" as const },
  },
  account: {
    base: "/account",
    options: { type: "protected" as const },
    profile: "/account/profile",
  },
} satisfies Record<string, RouteConfig | Record<string, unknown>>;

const exactOrChild = (path: string, base: string) =>
  path === base || path.startsWith(`${base}/`);

const protectedBases = [
  appRoutes.postLogin.base,
  appRoutes.dashboard.base,
  appRoutes.account.base,
];

const guestBases = [
  appRoutes.login.base,
  appRoutes.register.base,
  appRoutes.magicLink.base,
];

const publicBases = [appRoutes.index.base];

export const routeGroups = {
  public: publicBases,
  guest: guestBases,
  protected: protectedBases,
  organization: [] as string[],
  admin: [] as string[],
};

export const matchesRoute = (path: string, base: string) =>
  exactOrChild(path, base);

export function getRouteType(pathname: string): RouteType {
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
