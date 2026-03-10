export type DiscoveryDomainStrategy =
  | "direct"
  | "map_static_directory"
  | "map_spa_directory"
  | "lead_only";

export interface DiscoveryDomainConfig {
  host: string;
  strategy: DiscoveryDomainStrategy;
}

export const KNOWN_DISCOVERY_DOMAIN_CONFIGS: readonly DiscoveryDomainConfig[] =
  [
    {
      host: "cebupickleballcourts.com",
      strategy: "map_static_directory",
    },
    {
      host: "dumapickleball.com",
      strategy: "map_spa_directory",
    },
    {
      host: "facebook.com",
      strategy: "lead_only",
    },
    {
      host: "instagram.com",
      strategy: "lead_only",
    },
    {
      host: "tiktok.com",
      strategy: "lead_only",
    },
    {
      host: "reddit.com",
      strategy: "lead_only",
    },
    {
      host: "playpickleball.com",
      strategy: "lead_only",
    },
  ] as const;

function normalizeHost(value: string): string {
  return value.replace(/^www\./, "").toLowerCase();
}

function isDirectoryLikePath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/courts" ||
    pathname.startsWith("/courts/") === false ||
    pathname.startsWith("/category/")
  );
}

function isStaticDetailPath(pathname: string): boolean {
  if (pathname === "/" || pathname === "/courts") return false;
  if (pathname.startsWith("/category/")) return false;
  if (pathname.includes("sitemap")) return false;
  if (pathname.startsWith("/wp-")) return false;
  return true;
}

export function classifyDiscoveryUrl(url: string) {
  let hostname = "";
  let pathname = "";

  try {
    const parsed = new URL(url);
    hostname = normalizeHost(parsed.hostname);
    pathname = parsed.pathname.replace(/\/$/, "") || "/";
  } catch {
    return {
      host: "",
      pathname: "",
      strategy: "direct" as const,
      shouldMap: false,
      shouldEmitDirectly: true,
    };
  }

  const matchedConfig = KNOWN_DISCOVERY_DOMAIN_CONFIGS.find(
    (config) => normalizeHost(config.host) === hostname,
  );

  if (!matchedConfig) {
    return {
      host: hostname,
      pathname,
      strategy: "direct" as const,
      shouldMap: false,
      shouldEmitDirectly: true,
    };
  }

  if (matchedConfig.strategy === "map_static_directory") {
    const detailPath = isStaticDetailPath(pathname);
    return {
      host: hostname,
      pathname,
      strategy: matchedConfig.strategy,
      shouldMap: !detailPath,
      shouldEmitDirectly: detailPath,
    };
  }

  if (matchedConfig.strategy === "map_spa_directory") {
    return {
      host: hostname,
      pathname,
      strategy: matchedConfig.strategy,
      shouldMap: isDirectoryLikePath(pathname),
      shouldEmitDirectly: false,
    };
  }

  return {
    host: hostname,
    pathname,
    strategy: matchedConfig.strategy,
    shouldMap: false,
    shouldEmitDirectly: matchedConfig.strategy !== "lead_only",
  };
}

export function buildKnownDomainQueries(input: {
  city: string;
  province: string;
  sportSlug: string;
}): string[] {
  const sport = input.sportSlug.trim().toLowerCase();
  return KNOWN_DISCOVERY_DOMAIN_CONFIGS.filter(
    (config) =>
      config.strategy === "map_static_directory" ||
      config.strategy === "map_spa_directory",
  ).map(
    (config) => `site:${config.host} ${input.city} ${input.province} ${sport}`,
  );
}

export function getDiscoveryDomainConfigsByStrategy(
  strategy: DiscoveryDomainStrategy,
) {
  return KNOWN_DISCOVERY_DOMAIN_CONFIGS.filter(
    (config) => config.strategy === strategy,
  );
}
