import type { Logger } from "../types";
import { createConsoleLogger } from "./console";
import { createNoopLogger } from "./noop";

const canUseStorage = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const getDebugPattern = () => {
  if (!canUseStorage()) {
    return "";
  }

  return window.localStorage.getItem("debug") ?? "";
};

const normalizePattern = (pattern: string) => pattern.trim();

const matchesPattern = (scope: string, pattern: string) => {
  const normalized = normalizePattern(pattern);
  if (!normalized) {
    return false;
  }

  if (normalized === "*") {
    return true;
  }

  if (!normalized.includes("*")) {
    return scope === normalized;
  }

  const [prefix] = normalized.split("*");
  return scope.startsWith(prefix);
};

const isDebugEnabled = (scope: string) => {
  const debugValue = getDebugPattern();
  if (!debugValue) {
    return false;
  }

  return debugValue
    .split(",")
    .map((entry) => entry.trim())
    .some((pattern) => matchesPattern(scope, pattern));
};

export const createDebugLogger = (scope: string): Logger => {
  if (!isDebugEnabled(scope)) {
    return createNoopLogger(scope);
  }

  return createConsoleLogger(scope);
};
