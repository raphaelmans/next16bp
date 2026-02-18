import type { Logger } from "../types";

export const createNoopLogger = (_scope: string): Logger => ({
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
  child: (nextScope) => createNoopLogger(nextScope),
});
