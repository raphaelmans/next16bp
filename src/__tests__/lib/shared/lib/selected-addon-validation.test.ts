import { describe, expect, it } from "vitest";
import { getInvalidSelectedAddonIds } from "@/lib/shared/lib/selected-addon-validation";

describe("getInvalidSelectedAddonIds", () => {
  it("returns unique invalid addon IDs", () => {
    const invalid = getInvalidSelectedAddonIds({
      selectedAddons: [
        { addonId: "a-1" },
        { addonId: "missing-1" },
        { addonId: "missing-1" },
        { addonId: "missing-2" },
      ],
      allowedAddonIds: new Set(["a-1", "a-2"]),
    });

    expect(invalid).toEqual(["missing-1", "missing-2"]);
  });

  it("returns empty when all selected IDs are allowed", () => {
    const invalid = getInvalidSelectedAddonIds({
      selectedAddons: [{ addonId: "a-1" }, { addonId: "a-2" }],
      allowedAddonIds: new Set(["a-1", "a-2", "a-3"]),
    });

    expect(invalid).toEqual([]);
  });
});
