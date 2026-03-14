import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { appRoutes } from "@/common/app-routes";

const redirectMock = vi.fn((path: string) => {
  throw new Error(`REDIRECT:${path}`);
});

vi.mock("next/navigation", () => ({
  redirect: (path: string) => redirectMock(path),
}));

vi.mock("@/features/coach/pages/coach-dashboard-page", () => ({
  CoachDashboardPage: () => <div>Coach dashboard route</div>,
}));

vi.mock("@/features/coach/pages/coach-get-started-page", () => ({
  default: () => <div>Coach get-started route</div>,
}));

vi.mock("@/features/coach/pages/coach-profile-page", () => ({
  default: () => <div>Coach profile route</div>,
}));

vi.mock("@/features/coach/pages/coach-payment-methods-page", () => ({
  default: () => <div>Coach payment methods route</div>,
}));

vi.mock("@/features/coach/pages/coach-schedule-page", () => ({
  default: () => <div>Coach schedule route</div>,
}));

vi.mock("@/features/coach/pages/coach-pricing-page", () => ({
  default: () => <div>Coach pricing route</div>,
}));

vi.mock("@/features/coach/pages/coach-reservations-page", () => ({
  CoachReservationsPage: () => <div>Coach reservations route</div>,
}));

vi.mock("@/features/coach/pages/coach-settings-page", () => ({
  default: () => <div>Coach settings route</div>,
}));

import CoachDashboardRoutePage from "@/app/(coach)/coach/dashboard/page";
import CoachGetStartedRoutePage from "@/app/(coach)/coach/get-started/page";
import CoachPortalIndexPage from "@/app/(coach)/coach/page";
import CoachPaymentMethodsRoutePage from "@/app/(coach)/coach/payment-methods/page";
import CoachPricingRoutePage from "@/app/(coach)/coach/pricing/page";
import CoachProfileRoutePage from "@/app/(coach)/coach/profile/page";
import CoachReservationsRoutePage from "@/app/(coach)/coach/reservations/page";
import CoachScheduleRoutePage from "@/app/(coach)/coach/schedule/page";
import CoachSettingsRoutePage from "@/app/(coach)/coach/settings/page";

describe("coach portal route pages", () => {
  it("redirects the coach base route to the dashboard", () => {
    expect(() => CoachPortalIndexPage()).toThrow(
      `REDIRECT:${appRoutes.coach.dashboard}`,
    );
    expect(redirectMock).toHaveBeenCalledWith(appRoutes.coach.dashboard);
  });

  it.each([
    ["dashboard", CoachDashboardRoutePage, "Coach dashboard route"],
    ["get-started", CoachGetStartedRoutePage, "Coach get-started route"],
    ["profile", CoachProfileRoutePage, "Coach profile route"],
    [
      "payment methods",
      CoachPaymentMethodsRoutePage,
      "Coach payment methods route",
    ],
    ["schedule", CoachScheduleRoutePage, "Coach schedule route"],
    ["pricing", CoachPricingRoutePage, "Coach pricing route"],
    ["reservations", CoachReservationsRoutePage, "Coach reservations route"],
    ["settings", CoachSettingsRoutePage, "Coach settings route"],
  ])("renders the %s route page", (_label, RoutePage, marker) => {
    render(<RoutePage />);

    expect(screen.getByText(marker)).toBeTruthy();
  });
});
