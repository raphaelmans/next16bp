import type { Logger, LogMeta } from "../types";

export const withContext = (logger: Logger, context: LogMeta): Logger => {
  const mergeMeta = (meta?: LogMeta): LogMeta => ({
    ...context,
    ...(meta ?? {}),
  });

  return {
    debug: (message, meta) => logger.debug(message, mergeMeta(meta)),
    info: (message, meta) => logger.info(message, mergeMeta(meta)),
    warn: (message, meta) => logger.warn(message, mergeMeta(meta)),
    error: (message, meta) => logger.error(message, mergeMeta(meta)),
    child: (scope) => withContext(logger.child(scope), context),
  };
};
