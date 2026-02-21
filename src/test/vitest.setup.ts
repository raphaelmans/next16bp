import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Next.js recommends E2E tests for async Server Components.
// Unit coverage here targets deterministic client components and domain/service logic.
afterEach(() => {
  cleanup();
});
