import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

process.env.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??=
  "test-supabase-publishable-key";

// Next.js recommends E2E tests for async Server Components.
// Unit coverage here targets deterministic client components and domain/service logic.
afterEach(() => {
  cleanup();
});
