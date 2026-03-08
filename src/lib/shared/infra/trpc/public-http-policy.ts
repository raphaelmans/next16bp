const SERVER_ONLY_ANONYMOUS_PROCEDURES = new Set([
  "place.listSummary",
  "place.cardMediaByIds",
  "place.cardMetaByIds",
]);

const TRPC_PATH_PREFIX = "/api/trpc/";

export function getTrpcProcedurePaths(req: Request): string[] {
  const pathname = new URL(req.url).pathname;

  if (!pathname.startsWith(TRPC_PATH_PREFIX)) {
    return [];
  }

  const rawPath = pathname.slice(TRPC_PATH_PREFIX.length);
  if (!rawPath) {
    return [];
  }

  return rawPath
    .split(",")
    .map((path) => path.trim())
    .filter((path) => path.length > 0);
}

export function shouldBlockAnonymousTrpcHttpRequest(args: {
  isAuthenticated: boolean;
  procedurePaths: string[];
}) {
  if (args.isAuthenticated) {
    return false;
  }

  return args.procedurePaths.some((path) =>
    SERVER_ONLY_ANONYMOUS_PROCEDURES.has(path),
  );
}
