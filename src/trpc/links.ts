import {
  httpBatchLink,
  httpLink,
  isNonJsonSerializable,
  splitLink,
  type TRPCLink,
} from "@trpc/client";
import type { AppRouter } from "@/lib/shared/infra/trpc/root";

export const getTrpcBaseUrl = () => {
  if (typeof window !== "undefined") {
    return "";
  }

  return `http://localhost:${process.env.PORT ?? 3000}`;
};

export const createTrpcLinks = (): TRPCLink<AppRouter>[] => [
  splitLink({
    condition: (op) => isNonJsonSerializable(op.input),
    true: httpLink({
      url: `${getTrpcBaseUrl()}/api/trpc`,
    }),
    false: httpBatchLink({
      url: `${getTrpcBaseUrl()}/api/trpc`,
    }),
  }),
];
