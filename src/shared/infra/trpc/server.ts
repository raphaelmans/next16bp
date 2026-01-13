import { headers } from "next/headers";
import { env } from "@/lib/env";
import { createContext } from "@/shared/infra/trpc/context";
import { appRouter } from "@/shared/infra/trpc/root";
import { appRoutes } from "@/shared/lib/app-routes";

const buildRequestUrl = (pathname: string, headerStore: Headers) => {
  if (env.NEXT_PUBLIC_APP_URL) {
    return new URL(pathname, env.NEXT_PUBLIC_APP_URL).toString();
  }

  const forwardedHost = headerStore.get("x-forwarded-host");
  const forwardedProto = headerStore.get("x-forwarded-proto");
  if (forwardedHost) {
    return `${forwardedProto ?? "https"}://${forwardedHost}${pathname}`;
  }

  const host = headerStore.get("host");
  if (host) {
    const protocol = host.includes("localhost") ? "http" : "https";
    return `${protocol}://${host}${pathname}`;
  }

  return `http://localhost:3000${pathname}`;
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
