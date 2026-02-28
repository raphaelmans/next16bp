import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { NextResponse } from "next/server";
import { logger } from "@/lib/shared/infra/logger";
import { createContext } from "@/lib/shared/infra/trpc/context";
import { appRouter } from "@/lib/shared/infra/trpc/root";

/**
 * tRPC HTTP handler for Next.js App Router.
 * Handles all tRPC requests at /api/trpc/*
 */
function isAllowedOrigin(origin: string, req: Request) {
  const reqOrigin = new URL(req.url).origin;
  const allowed = new Set<string>([reqOrigin]);
  // Use process.env directly — the validated `env` helper strips non-local
  // URLs in development, but we still need to trust tunnel origins for CSRF.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    allowed.add(new URL(appUrl).origin);
  }
  return allowed.has(origin);
}

function getTrpcPath(req: Request) {
  const pathname = new URL(req.url).pathname;
  const trpcPathPrefix = "/api/trpc/";
  if (pathname.startsWith(trpcPathPrefix)) {
    return pathname.slice(trpcPathPrefix.length) || "unknown";
  }

  return pathname === "/api/trpc" ? "unknown" : pathname;
}

async function handleTrpcRequest(req: Request, method: "GET" | "POST") {
  const origin = req.headers.get("origin");
  const secFetchSite = req.headers.get("sec-fetch-site");

  // When an explicit origin is present, validate it against the allowlist.
  // This covers tunnel/proxy setups where sec-fetch-site may report "cross-site"
  // even though the origin is trusted (e.g. NEXT_PUBLIC_APP_URL).
  if (origin) {
    if (!isAllowedOrigin(origin, req)) {
      return NextResponse.json({ error: "CSRF blocked" }, { status: 403 });
    }
  } else if (secFetchSite && secFetchSite.toLowerCase() === "cross-site") {
    // No origin header but browser says cross-site → block.
    return NextResponse.json({ error: "CSRF blocked" }, { status: 403 });
  }

  try {
    return await fetchRequestHandler({
      endpoint: "/api/trpc",
      req,
      router: appRouter,
      createContext,
      onError({ error, path, type, input, ctx, req: trpcRequest }) {
        const requestId =
          ctx?.requestId ??
          trpcRequest.headers.get("x-request-id") ??
          "unknown";
        const log = ctx?.log ?? logger;

        log.error(
          {
            scope: "trpc:http",
            event: "trpc.request_failed",
            requestId,
            method,
            path: path ?? getTrpcPath(trpcRequest),
            procedureType: type,
            hasInput: input !== undefined,
            err: error,
          },
          "Unhandled tRPC request error",
        );
      },
    });
  } catch (error) {
    const requestId =
      req.headers.get("x-request-id") ?? globalThis.crypto.randomUUID();

    logger.error(
      {
        scope: "trpc:http",
        event: "trpc.handler_crashed",
        requestId,
        method,
        path: getTrpcPath(req),
        err: error,
      },
      "tRPC HTTP handler crashed",
    );

    return NextResponse.json(
      { error: "Internal Server Error", requestId },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  return handleTrpcRequest(req, "POST");
}

export async function GET(req: Request) {
  return handleTrpcRequest(req, "GET");
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
