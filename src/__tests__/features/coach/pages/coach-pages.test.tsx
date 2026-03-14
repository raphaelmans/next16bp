import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const coachSetupStatusState = vi.hoisted(() => ({
  data: {
    coachId: "coach-1",
  } as { coachId: string | null } | null,
  isLoading: false,
  error: null as Error | null,
  refetch: vi.fn(async () => undefined),
}));

vi.mock("@/features/coach/hooks", () => ({
  useQueryCoachSetupStatus: () => coachSetupStatusState,
}));

vi.mock("@/features/coach/components/coach-schedule-editor", () => ({
  CoachScheduleEditor: ({ coachId }: { coachId: string }) => (
    <div>Schedule editor for {coachId}</div>
  ),
}));

vi.mock("@/features/coach/components/coach-block-manager", () => ({
  CoachBlockManager: ({ coachId }: { coachId: string }) => (
    <div>Block manager for {coachId}</div>
  ),
}));

vi.mock("@/features/coach/components/coach-pricing-editor", () => ({
  CoachPricingEditor: ({ coachId }: { coachId: string }) => (
    <div>Pricing editor for {coachId}</div>
  ),
}));

vi.mock("@/features/coach/components/coach-addon-editor", () => ({
  CoachAddonEditor: ({ coachId }: { coachId: string }) => (
    <div>Addon editor for {coachId}</div>
  ),
}));

vi.mock("@/features/coach/components/coach-payment-methods-manager", () => ({
  CoachPaymentMethodsManager: ({ coachId }: { coachId: string }) => (
    <div>Payment manager for {coachId}</div>
  ),
}));

import CoachPaymentMethodsPage from "@/features/coach/pages/coach-payment-methods-page";
import CoachPricingPage from "@/features/coach/pages/coach-pricing-page";
import CoachSchedulePage from "@/features/coach/pages/coach-schedule-page";

describe("coach schedule and pricing pages", () => {
  beforeEach(() => {
    coachSetupStatusState.data = { coachId: "coach-1" };
    coachSetupStatusState.isLoading = false;
    coachSetupStatusState.error = null;
  });

  it("schedule page renders live editors when a coach profile exists", () => {
    render(<CoachSchedulePage />);

    expect(
      screen.getByText("Manage weekly hours and blocked time"),
    ).toBeTruthy();
    expect(screen.getByText("Schedule editor for coach-1")).toBeTruthy();
    expect(screen.getByText("Block manager for coach-1")).toBeTruthy();
  });

  it("pricing page renders live editors when a coach profile exists", () => {
    render(<CoachPricingPage />);

    expect(screen.getByText("Define session rates and add-ons")).toBeTruthy();
    expect(screen.getByText("Pricing editor for coach-1")).toBeTruthy();
    expect(screen.getByText("Addon editor for coach-1")).toBeTruthy();
  });

  it("payment methods page renders the live manager when a coach profile exists", () => {
    render(<CoachPaymentMethodsPage />);

    expect(
      screen.getByText("Manage how players pay for sessions"),
    ).toBeTruthy();
    expect(screen.getByText("Payment manager for coach-1")).toBeTruthy();
  });

  it("schedule page shows the prerequisite state when coachId is missing", () => {
    coachSetupStatusState.data = { coachId: null };

    render(<CoachSchedulePage />);

    expect(screen.getByText("Create your coach profile first")).toBeTruthy();
    expect(screen.queryByText("Schedule editor for coach-1")).toBeNull();
  });

  it("payment methods page shows the prerequisite state when coachId is missing", () => {
    coachSetupStatusState.data = { coachId: null };

    render(<CoachPaymentMethodsPage />);

    expect(screen.getByText("Create your coach profile first")).toBeTruthy();
    expect(screen.queryByText("Payment manager for coach-1")).toBeNull();
  });
});
