import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

import { PaymentStep } from "@/features/coach/components/get-started/wizard/steps/payment-step";
import { PricingStep } from "@/features/coach/components/get-started/wizard/steps/pricing-step";
import { ScheduleStep } from "@/features/coach/components/get-started/wizard/steps/schedule-step";

describe("coach setup live schedule and pricing steps", () => {
  it("schedule step renders the live schedule tools when coachId exists", () => {
    render(<ScheduleStep isComplete={false} coachId="coach-1" />);

    expect(screen.getByText("Add weekly availability")).toBeTruthy();
    expect(screen.getByText("Schedule editor for coach-1")).toBeTruthy();
    expect(screen.getByText("Block manager for coach-1")).toBeTruthy();
  });

  it("pricing step renders the live pricing tools when coachId exists", () => {
    render(<PricingStep isComplete={true} coachId="coach-1" />);

    expect(screen.getByText("Define your pricing")).toBeTruthy();
    expect(screen.getByText("Pricing editor for coach-1")).toBeTruthy();
    expect(screen.getByText("Addon editor for coach-1")).toBeTruthy();
  });

  it("schedule step falls back to a placeholder when coachId is missing", () => {
    render(<ScheduleStep isComplete={false} coachId={null} />);

    expect(
      screen.getByText(
        "Schedule tools are ready, but they need an existing coach profile first. Finish the earlier setup steps, then return here to publish recurring availability and one-off blocks.",
      ),
    ).toBeTruthy();
    expect(screen.queryByText("Schedule editor for coach-1")).toBeNull();
  });

  it("payment step renders the live payment manager when coachId exists", () => {
    render(<PaymentStep isComplete={false} coachId="coach-1" />);

    expect(screen.getByText("Payment manager for coach-1")).toBeTruthy();
  });

  it("payment step shows the completed state when payment methods are ready", () => {
    render(<PaymentStep isComplete={true} coachId="coach-1" />);

    expect(screen.getByText("Payment method added")).toBeTruthy();
    expect(screen.getByText("Manage payment methods")).toBeTruthy();
  });
});
