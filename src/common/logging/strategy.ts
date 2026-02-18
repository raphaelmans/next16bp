import { createConsoleLogger } from "./adapters/console";
import { createDebugLogger } from "./adapters/debug";
import { createNoopLogger } from "./adapters/noop";
import type { Logger } from "./types";
import { withRedaction } from "./wrappers/with-redaction";

type LoggerProvider = "debug" | "console" | "noop";

const getOverrideProvider = (): LoggerProvider | null => {
  if (process.env.NEXT_PUBLIC_ALLOW_BREAK_GLASS_LOGGING !== "true") {
    return null;
  }

  if (typeof window === "undefined") {
    return null;
  }

  const override = window.localStorage.getItem("app:log:provider");
  if (override === "debug" || override === "console" || override === "noop") {
    return override;
  }

  return null;
};

const getDefaultProvider = (): LoggerProvider => {
  if (process.env.NODE_ENV === "production") {
    return "noop";
  }

  return "debug";
};

const createProviderLogger = (
  scope: string,
  provider: LoggerProvider,
): Logger => {
  switch (provider) {
    case "console":
      return createConsoleLogger(scope);
    case "noop":
      return createNoopLogger(scope);
    default:
      return createDebugLogger(scope);
  }
};

export const createScopedLogger = (scope: string): Logger => {
  const provider = getOverrideProvider() ?? getDefaultProvider();
  return withRedaction(createProviderLogger(scope, provider));
};
