import { createQueryKeys } from "@lukemorales/query-key-factory";

export const googleLocQueryKeys = createQueryKeys("googleLoc", {
  all: null,
  preview: (url: string) => [url],
});
