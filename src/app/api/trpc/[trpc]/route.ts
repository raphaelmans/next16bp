import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
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

export async function POST(req: Request) {
  const secFetchSite = req.headers.get("sec-fetch-site");
  if (secFetchSite && secFetchSite.toLowerCase() === "cross-site") {
    return NextResponse.json({ error: "CSRF blocked" }, { status: 403 });
  }

  const origin = req.headers.get("origin");
  if (origin && !isAllowedOrigin(origin, req)) {
    return NextResponse.json({ error: "CSRF blocked" }, { status: 403 });
  }

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
  });
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
