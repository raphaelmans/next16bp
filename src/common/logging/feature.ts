import { createScopedLogger } from "./strategy";
import type { Logger, LogMeta } from "./types";
import { withContext } from "./wrappers/with-context";
import { withSampling } from "./wrappers/with-sampling";

const ROOT_SCOPE = "app";

export const createFeatureLogger = (
  feature: string,
  area: string,
  options?: {
    context?: LogMeta;
    sampleRate?: number;
  },
): Logger => {
  const base = createScopedLogger(`${ROOT_SCOPE}:${feature}:${area}`);
  const withCtx = options?.context ? withContext(base, options.context) : base;
  const sampleRate = options?.sampleRate ?? 1;

  return withSampling(withCtx, sampleRate);
};
