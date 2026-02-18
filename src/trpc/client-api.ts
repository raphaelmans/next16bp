import { createTRPCClient } from "@trpc/client";
import type { AppRouter } from "@/lib/shared/infra/trpc/root";
import { createTrpcLinks } from "./links";

export type TrpcClientApi = ReturnType<typeof createClientApi>;

export const createClientApi = () =>
  createTRPCClient<AppRouter>({
    links: createTrpcLinks(),
  });

let browserClientApi: TrpcClientApi | undefined;

export const getClientApi = (): TrpcClientApi => {
  if (typeof window === "undefined") {
    return createClientApi();
  }

  browserClientApi ??= createClientApi();
  return browserClientApi;
};
