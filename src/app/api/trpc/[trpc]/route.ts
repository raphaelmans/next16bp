import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
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
  if (env.NEXT_PUBLIC_APP_URL) {
    allowed.add(new URL(env.NEXT_PUBLIC_APP_URL).origin);
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
  const secFetchSite = req.headers.get("sec-fetch-site");
  if (secFetchSite && secFetchSite.toLowerCase() === "cross-site") {
    return NextResponse.json({ error: "CSRF blocked" }, { status: 403 });
  }

  const origin = req.headers.get("origin");
  if (origin && !isAllowedOrigin(origin, req)) {
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
