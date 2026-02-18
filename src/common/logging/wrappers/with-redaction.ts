import type { Logger, LogMeta } from "../types";

const REDACTED = "[REDACTED]";
const SENSITIVE_KEYS = ["password", "token", "secret", "authorization"];

const redactMeta = (meta?: LogMeta): LogMeta | undefined => {
  if (!meta) {
    return undefined;
  }

  const next: LogMeta = {};
  for (const [key, value] of Object.entries(meta)) {
    if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
      next[key] = REDACTED;
    } else {
      next[key] = value;
    }
  }

  return next;
};

export const withRedaction = (logger: Logger): Logger => ({
  debug: (message, meta) => logger.debug(message, redactMeta(meta)),
  info: (message, meta) => logger.info(message, redactMeta(meta)),
  warn: (message, meta) => logger.warn(message, redactMeta(meta)),
  error: (message, meta) => logger.error(message, redactMeta(meta)),
  child: (scope) => withRedaction(logger.child(scope)),
});
