import { headers } from "next/headers";
import { appRoutes } from "@/common/app-routes";
import { env } from "@/lib/env";
import { createContext } from "@/lib/shared/infra/trpc/context";
import { appRouter } from "@/lib/shared/infra/trpc/root";

const buildRequestUrl = (pathname: string, headerStore: Headers) => {
  if (env.NEXT_PUBLIC_APP_URL) {
    return new URL(pathname, env.NEXT_PUBLIC_APP_URL).toString();
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_APP_URL is required in production");
  }

  const host = headerStore.get("host");
  const protocol = host?.includes("localhost") ? "http" : "http";
  return `${protocol}://${host ?? "localhost:3000"}${pathname}`;
};

const buildRequestInfo = (url: string) => ({
  accept: null,
  type: "unknown" as const,
  isBatchCall: false,
  calls: [],
  connectionParams: null,
  signal: new AbortController().signal,
  url: new URL(url),
});

export async function createServerCaller(pathname?: string) {
  const headerStore = await headers();
  const path =
    pathname ?? headerStore.get("x-pathname") ?? appRoutes.index.base;
  const requestHeaders = new Headers(headerStore);
  const url = buildRequestUrl(path, requestHeaders);
  const req = new Request(url, { headers: requestHeaders, method: "GET" });
  const ctx = await createContext({
    req,
    resHeaders: new Headers(),
    info: buildRequestInfo(url),
  });

  return appRouter.createCaller(ctx);
}
