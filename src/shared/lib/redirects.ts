import { appRoutes } from "@/shared/lib/app-routes";

type SafeRedirectOptions = {
  fallback?: string;
  origin?: string;
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
      return `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`;
    } catch {
      return fallback;
    }
  }

  if (!decoded.startsWith("/") || decoded.startsWith("//")) {
    return fallback;
  }

  return decoded;
};
