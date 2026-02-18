// tRPC features use generated procedure keys via trpc.useUtils().
// Keep cross-feature non-tRPC key factories in this folder when introduced.
export const queryKeyScopes = {
  app: ["app"] as const,
};
