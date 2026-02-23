import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PlayerAddonSelector } from "@/features/court-addons/components/player-addon-selector";
import type { CourtAddonConfig } from "@/features/court-addons/helpers";

function makeOptionalConfig(id: string, label: string): CourtAddonConfig {
  return {
    addon: {
      id,
      label,
      isActive: true,
      mode: "OPTIONAL",
      pricingType: "FLAT",
      flatFeeCents: 100,
      displayOrder: 0,
    },
    rules: [],
  };
}

describe("PlayerAddonSelector", () => {
  it("shows venue-wide badge for addon IDs included in globalAddonIds", () => {
    render(
      <PlayerAddonSelector
        addons={[
          makeOptionalConfig("addon-global", "Venue Paddle Rental"),
          makeOptionalConfig("addon-court", "Court Lighting"),
        ]}
        selectedAddons={[]}
        onSelectedAddonsChange={vi.fn()}
        globalAddonIds={new Set(["addon-global"])}
      />,
    );

    expect(screen.getByText("Venue-wide")).toBeTruthy();
  });

  it("does not show venue-wide badge when no IDs are marked global", () => {
    render(
      <PlayerAddonSelector
        addons={[makeOptionalConfig("addon-court", "Court Lighting")]}
        selectedAddons={[]}
        onSelectedAddonsChange={vi.fn()}
        globalAddonIds={new Set()}
      />,
    );

    expect(screen.queryByText("Venue-wide")).toBeNull();
  });
});
