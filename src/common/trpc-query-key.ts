import { skipToken } from "@tanstack/react-query";

export const buildTrpcQueryKey = (
  path: readonly string[],
  input?: unknown,
): readonly unknown[] => {
  const splitPath = path.flatMap((part) => part.split("."));

  return [
    splitPath,
    {
      ...(typeof input !== "undefined" && input !== skipToken ? { input } : {}),
      type: "query" as const,
    },
  ];
};
