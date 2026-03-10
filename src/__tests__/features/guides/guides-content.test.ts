import { describe, expect, it } from "vitest";
import {
  DEVELOPER_GUIDE_SLUG,
  GUIDE_ENTRIES,
  getGuideBySlug,
} from "@/features/guides/content/guides";

describe("guides content", () => {
  it("includes the developer integration guide entry", () => {
    const guide = getGuideBySlug(DEVELOPER_GUIDE_SLUG);

    expect(guide).toBeDefined();
    expect(guide?.audience).toBe("developers");
    expect(guide?.title).toContain("Developer API");
  });

  it("keeps guide audiences grouped across players, owners, and developers", () => {
    const audiences = new Set(GUIDE_ENTRIES.map((guide) => guide.audience));

    expect(audiences).toEqual(new Set(["players", "owners", "developers"]));
  });
});
