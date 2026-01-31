import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProduction ? "info" : "debug"),

  // Pretty print in development
  transport: isProduction
    ? undefined
    : {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      },

  // Redact sensitive fields
  redact: {
    paths: [
      "password",
      "passwordHash",
      "token",
      "accessToken",
      "refreshToken",
      "authorization",
      "cookie",
      "creditCard",
      "cardNumber",
      "cvv",
      "ssn",
      "*.password",
      "*.passwordHash",
      "*.token",
      "*.accessToken",
      "*.refreshToken",
      "*.authorization",
      "*.creditCard",
      "*.cardNumber",
      "*.cvv",
      "*.ssn",
    ],
    censor: "[REDACTED]",
  },

  // Base context for all logs
  base: {
    env: process.env.NODE_ENV,
    service: process.env.SERVICE_NAME ?? "api",
  },
});

export type Logger = typeof logger;

/**
 * Request log context for creating child loggers with correlation.
 */
export interface RequestLogContext {
  requestId: string;
  userId?: string;
  method?: string;
  path?: string;
}

/**
 * Creates a child logger with request context for correlation.
 */
export function createRequestLogger(ctx: RequestLogContext) {
  return logger.child(ctx);
}
