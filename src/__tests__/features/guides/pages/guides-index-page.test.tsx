import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GUIDE_ENTRIES } from "@/features/guides/content/guides";
import { GuidesIndexPage } from "@/features/guides/pages/guides-index-page";

describe("GuidesIndexPage", () => {
  it("renders the developers guide section and featured developer guide", () => {
    render(<GuidesIndexPage guides={GUIDE_ENTRIES} />);

    expect(
      screen.getByRole("heading", { name: "Guides for developers" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", {
        name: "How To Connect Your Venue System To The KudosCourts Developer API",
      }),
    ).toBeTruthy();
  });
});
