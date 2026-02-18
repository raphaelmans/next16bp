import type { Logger, LogMeta } from "../types";

const toArgs = (scope: string, message: string, meta?: LogMeta): unknown[] => {
  if (meta) {
    return [`[${scope}] ${message}`, meta];
  }

  return [`[${scope}] ${message}`];
};

export const createConsoleLogger = (scope: string): Logger => ({
  debug: (message, meta) => {
    console.debug(...toArgs(scope, message, meta));
  },
  info: (message, meta) => {
    console.info(...toArgs(scope, message, meta));
  },
  warn: (message, meta) => {
    console.warn(...toArgs(scope, message, meta));
  },
  error: (message, meta) => {
    console.error(...toArgs(scope, message, meta));
  },
  child: (childScope) => createConsoleLogger(`${scope}:${childScope}`),
});
