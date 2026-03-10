import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { DeveloperGuideArticlePage } from "@/features/guides/components/developer-guide-article-page";

beforeAll(() => {
  class MockIntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  // @ts-expect-error test shim
  globalThis.IntersectionObserver = MockIntersectionObserver;
});

describe("DeveloperGuideArticlePage", () => {
  it("renders the developer integration steps and 1:1 preview wrappers", () => {
    render(<DeveloperGuideArticlePage />);

    expect(
      screen.getByRole("heading", {
        name: "Create one integration for each external platform",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        name: "Run one safe live availability read in the guided console",
      }),
    ).toBeTruthy();
    expect(screen.getAllByText("What you will see").length).toBeGreaterThan(0);
  });
});
