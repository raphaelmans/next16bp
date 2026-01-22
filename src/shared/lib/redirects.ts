import {
  appRoutes,
  getRouteType,
  type RouteType,
} from "@/shared/lib/app-routes";

type SafeRedirectOptions = {
  fallback?: string;
  origin?: string;
  disallowRoutes?: RouteType[];
  disallowPathname?: string;
};

const getRedirectPathname = (path: string) => {
  try {
    return new URL(path, "https://kudoscourts.local").pathname;
  } catch {
    return path.split("?")[0]?.split("#")[0] ?? path;
  }
};

const applyRedirectPolicy = (
  path: string,
  options: SafeRedirectOptions,
  fallback: string,
) => {
  const pathname = getRedirectPathname(path);

  if (options.disallowPathname && pathname === options.disallowPathname) {
    return fallback;
  }

  if (options.disallowRoutes?.length) {
    const routeType = getRouteType(pathname);
    if (options.disallowRoutes.includes(routeType)) {
      return fallback;
    }
  }

  return path;
};

const decodeRedirectValue = (value: string) => {
  let decoded = value;
  for (let pass = 0; pass < 2; pass += 1) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) {
        break;
      }
      decoded = next;
    } catch {
      break;
    }
  }

  return decoded;
};

export const getSafeRedirectPath = (
  value: string | null | undefined,
  options: SafeRedirectOptions = {},
) => {
  const fallback = options.fallback ?? appRoutes.home.base;
  if (!value) {
    return fallback;
  }

  const decoded = decodeRedirectValue(value.trim());
  if (!decoded) {
    return fallback;
  }

  if (decoded.startsWith("http://") || decoded.startsWith("https://")) {
    if (!options.origin) {
      return fallback;
    }

    try {
      const originUrl = new URL(options.origin);
      const targetUrl = new URL(decoded);
      if (originUrl.origin !== targetUrl.origin) {
        return fallback;
      }
      return applyRedirectPolicy(
        `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`,
        options,
        fallback,
      );
    } catch {
      return fallback;
    }
  }

  if (!decoded.startsWith("/") || decoded.startsWith("//")) {
    return fallback;
  }

  return applyRedirectPolicy(decoded, options, fallback);
};
