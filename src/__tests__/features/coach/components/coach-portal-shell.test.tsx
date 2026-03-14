import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRoutes } from "@/common/app-routes";

const pathnameState = vi.hoisted(() => ({
  value: "/coach/dashboard",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameState.value,
}));

import { CoachPortalShell } from "@/features/coach/components/coach-portal-shell";

describe("CoachPortalShell", () => {
  beforeEach(() => {
    pathnameState.value = appRoutes.coach.dashboard;
  });

  it("renders real links for every coach portal destination", () => {
    render(
      <CoachPortalShell>
        <div>Portal content</div>
      </CoachPortalShell>,
    );

    const expectedLinks = [
      ["Dashboard", appRoutes.coach.dashboard],
      ["Get Started", appRoutes.coach.getStarted],
      ["Profile", appRoutes.coach.profile],
      ["Payment Methods", appRoutes.coach.paymentMethods],
      ["Schedule", appRoutes.coach.schedule],
      ["Pricing", appRoutes.coach.pricing],
      ["Reservations", appRoutes.coach.reservations],
      ["Settings", appRoutes.coach.settings],
    ] as const;

    for (const [label, href] of expectedLinks) {
      const link = screen.getByRole("link", { name: new RegExp(label, "i") });
      expect(link.getAttribute("href")).toBe(href);
    }

    expect(screen.queryByText("Upcoming")).toBeNull();
    expect(
      screen.queryByText(
        /remaining coach portal surfaces land in later tasks/i,
      ),
    ).toBeNull();
  });

  it("marks the current coach route as open", () => {
    pathnameState.value = appRoutes.coach.settings;

    render(
      <CoachPortalShell>
        <div>Portal content</div>
      </CoachPortalShell>,
    );

    expect(
      screen.getByRole("link", { name: /settings/i }).getAttribute("href"),
    ).toBe(appRoutes.coach.settings);
    expect(screen.getByText("Open")).toBeTruthy();
  });
});
