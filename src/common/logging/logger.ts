import { createScopedLogger } from "./strategy";
import type { LogMeta } from "./types";

export interface ClientLogger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

const baseLogger = createScopedLogger("app:client:runtime");

const normalizeArgs = (
  args: unknown[],
): { message: string; meta?: LogMeta } => {
  if (args.length === 0) {
    return { message: "" };
  }

  const [first, second] = args;
  const message = typeof first === "string" ? first : JSON.stringify(first);

  if (second && typeof second === "object" && !Array.isArray(second)) {
    return {
      message,
      meta: second as LogMeta,
    };
  }

  if (args.length > 1) {
    return {
      message,
      meta: { args: args.slice(1) },
    };
  }

  return { message };
};

export const logger: ClientLogger = {
  debug: (...args) => {
    const { message, meta } = normalizeArgs(args);
    baseLogger.debug(message, meta);
  },
  info: (...args) => {
    const { message, meta } = normalizeArgs(args);
    baseLogger.info(message, meta);
  },
  warn: (...args) => {
    const { message, meta } = normalizeArgs(args);
    baseLogger.warn(message, meta);
  },
  error: (...args) => {
    const { message, meta } = normalizeArgs(args);
    baseLogger.error(message, meta);
  },
};
