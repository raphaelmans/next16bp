import type { Logger } from "../types";

const shouldLog = (rate: number) => {
  if (rate >= 1) {
    return true;
  }

  if (rate <= 0) {
    return false;
  }

  return Math.random() <= rate;
};

export const withSampling = (logger: Logger, rate = 1): Logger => ({
  debug: (message, meta) => {
    if (shouldLog(rate)) {
      logger.debug(message, meta);
    }
  },
  info: (message, meta) => {
    if (shouldLog(rate)) {
      logger.info(message, meta);
    }
  },
  warn: (message, meta) => {
    if (shouldLog(rate)) {
      logger.warn(message, meta);
    }
  },
  error: (message, meta) => {
    logger.error(message, meta);
  },
  child: (scope) => withSampling(logger.child(scope), rate),
});
