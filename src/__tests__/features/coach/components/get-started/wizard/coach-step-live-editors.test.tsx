import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const hookState = vi.hoisted(() => ({
  profileQuery: {
    data: null as {
      coach: {
        id: string;
        name: string | null;
        tagline: string | null;
        bio: string | null;
      };
      sports: Array<{ sportId: string }>;
      certifications: Array<{
        id: string;
        coachId: string;
        name: string;
        issuingBody: string | null;
        level: string | null;
        createdAt: Date;
      }>;
    } | null,
    isLoading: false,
    error: null as Error | null,
    refetch: vi.fn(),
  },
  sportsQuery: {
    data: [
      {
        id: "11111111-1111-4111-8111-111111111111",
        name: "Badminton",
      },
      {
        id: "22222222-2222-4222-8222-222222222222",
        name: "Tennis",
      },
    ],
    isLoading: false,
    error: null as Error | null,
    refetch: vi.fn(),
  },
  updateProfileMutateAsync: vi.fn(),
  submitVerificationMutateAsync: vi.fn(),
}));

vi.mock("@/features/coach/hooks", () => ({
  useQueryCoachMyProfile: () => hookState.profileQuery,
  useQueryCoachSports: () => hookState.sportsQuery,
  useMutCoachUpdateProfile: () => ({
    mutateAsync: hookState.updateProfileMutateAsync,
    isPending: false,
  }),
  useMutCoachSubmitVerification: () => ({
    mutateAsync: hookState.submitVerificationMutateAsync,
    isPending: false,
  }),
}));

vi.mock("@/common/toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
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

import { PaymentStep } from "@/features/coach/components/get-started/wizard/steps/payment-step";
import { PricingStep } from "@/features/coach/components/get-started/wizard/steps/pricing-step";
import { ProfileStep } from "@/features/coach/components/get-started/wizard/steps/profile-step";
import { ScheduleStep } from "@/features/coach/components/get-started/wizard/steps/schedule-step";
import { SportsStep } from "@/features/coach/components/get-started/wizard/steps/sports-step";
import { VerifyStep } from "@/features/coach/components/get-started/wizard/steps/verify-step";

describe("coach setup live editors", () => {
  beforeAll(() => {
    globalThis.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  beforeEach(() => {
    hookState.profileQuery = {
      data: null,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    };
    hookState.sportsQuery = {
      data: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          name: "Badminton",
        },
        {
          id: "22222222-2222-4222-8222-222222222222",
          name: "Tennis",
        },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    };
    hookState.updateProfileMutateAsync.mockReset();
    hookState.submitVerificationMutateAsync.mockReset();
  });

  it("profile step saves the real coach basics form", async () => {
    hookState.updateProfileMutateAsync.mockResolvedValue({
      coach: { id: "coach-1" },
    });

    render(<ProfileStep isComplete={false} />);

    const nameInput = document.querySelector('input[name="name"]');
    const taglineInput = document.querySelector('input[name="tagline"]');
    const bioInput = document.querySelector('textarea[name="bio"]');

    expect(nameInput).toBeTruthy();
    expect(taglineInput).toBeTruthy();
    expect(bioInput).toBeTruthy();

    fireEvent.change(nameInput as Element, {
      target: { value: " Coach Alex " },
    });
    fireEvent.change(taglineInput as Element, {
      target: { value: " Private badminton sessions " },
    });
    fireEvent.change(bioInput as Element, {
      target: { value: " Competitive player turned coach " },
    });
    fireEvent.blur(nameInput as Element);
    fireEvent.blur(taglineInput as Element);
    fireEvent.blur(bioInput as Element);

    await waitFor(() => {
      expect(
        (
          screen.getByRole("button", {
            name: "Create coach profile",
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(false);
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Create coach profile" }),
    );

    await waitFor(() => {
      expect(hookState.updateProfileMutateAsync).toHaveBeenCalledWith({
        name: "Coach Alex",
        tagline: "Private badminton sessions",
        bio: "Competitive player turned coach",
      });
    });
  });

  it("profile step shows required validation messages", async () => {
    render(<ProfileStep isComplete={false} />);

    fireEvent.submit(document.querySelector("form") as HTMLFormElement);

    await waitFor(() => {
      expect(screen.getByText("Name is required")).toBeTruthy();
      expect(screen.getByText("Tagline is required")).toBeTruthy();
      expect(screen.getByText("Bio is required")).toBeTruthy();
    });
  });

  it("sports step saves the selected sports", async () => {
    hookState.profileQuery.data = {
      coach: {
        id: "coach-1",
        name: "Coach Alex",
        tagline: "Private badminton sessions",
        bio: "Competitive player turned coach",
      },
      sports: [],
      certifications: [],
    };
    hookState.updateProfileMutateAsync.mockResolvedValue({
      coach: { id: "coach-1" },
    });

    render(<SportsStep isComplete={false} coachId="coach-1" />);

    fireEvent.click(screen.getByText("Badminton"));

    await waitFor(() => {
      expect(
        (
          screen.getByRole("button", {
            name: "Save sports",
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(false);
    });
    fireEvent.click(screen.getByRole("button", { name: "Save sports" }));

    await waitFor(() => {
      expect(hookState.updateProfileMutateAsync).toHaveBeenCalledWith({
        sportIds: ["11111111-1111-4111-8111-111111111111"],
      });
    });
  });

  it("sports step requires a coach profile before saving sports", () => {
    render(<SportsStep isComplete={false} coachId={null} />);

    expect(
      screen.getByText("Save your profile before choosing sports"),
    ).toBeTruthy();
  });

  it("sports step shows an empty state when no sports are available", () => {
    hookState.profileQuery.data = {
      coach: {
        id: "coach-1",
        name: "Coach Alex",
        tagline: "Private badminton sessions",
        bio: "Competitive player turned coach",
      },
      sports: [],
      certifications: [],
    };
    hookState.sportsQuery.data = [];

    render(<SportsStep isComplete={false} coachId="coach-1" />);

    expect(screen.getByText("No sports available")).toBeTruthy();
  });

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

  it("verify step stays blocked until the earlier steps are complete", () => {
    hookState.profileQuery.data = {
      coach: {
        id: "coach-1",
        name: "Coach Alex",
        tagline: "Private badminton sessions",
        bio: "Competitive player turned coach",
      },
      sports: [],
      certifications: [],
    };

    render(
      <VerifyStep
        status={{
          coachId: "coach-1",
          hasCoachProfile: true,
          hasCoachSports: true,
          hasCoachLocation: true,
          hasCoachSchedule: false,
          hasCoachPricing: false,
          hasPaymentMethod: false,
          hasVerification: false,
          verificationStatus: "UNVERIFIED",
          isSetupComplete: false,
          nextStep: "schedule",
        }}
      />,
    );

    expect(
      screen.getByText("Finish the earlier setup steps first"),
    ).toBeTruthy();
  });

  it("verify step shows pending review state", async () => {
    hookState.profileQuery.data = {
      coach: {
        id: "coach-1",
        name: "Coach Alex",
        tagline: "Private badminton sessions",
        bio: "Competitive player turned coach",
      },
      sports: [],
      certifications: [
        {
          id: "cert-1",
          coachId: "coach-1",
          name: "PTR",
          issuingBody: "PTR",
          level: "L1",
          createdAt: new Date("2026-03-15T00:00:00.000Z"),
        },
      ],
    };

    render(
      <VerifyStep
        status={{
          coachId: "coach-1",
          hasCoachProfile: true,
          hasCoachSports: true,
          hasCoachLocation: true,
          hasCoachSchedule: true,
          hasCoachPricing: true,
          hasPaymentMethod: true,
          hasVerification: false,
          verificationStatus: "PENDING",
          isSetupComplete: false,
          nextStep: "verify",
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getAllByText("Verification pending review")).toHaveLength(
        2,
      );
    });
  });

  it("verify step shows approved state once verification is complete", async () => {
    hookState.profileQuery.data = {
      coach: {
        id: "coach-1",
        name: "Coach Alex",
        tagline: "Private badminton sessions",
        bio: "Competitive player turned coach",
      },
      sports: [],
      certifications: [
        {
          id: "cert-1",
          coachId: "coach-1",
          name: "PTR",
          issuingBody: "PTR",
          level: "L1",
          createdAt: new Date("2026-03-15T00:00:00.000Z"),
        },
      ],
    };

    render(
      <VerifyStep
        status={{
          coachId: "coach-1",
          hasCoachProfile: true,
          hasCoachSports: true,
          hasCoachLocation: true,
          hasCoachSchedule: true,
          hasCoachPricing: true,
          hasPaymentMethod: true,
          hasVerification: true,
          verificationStatus: "VERIFIED",
          isSetupComplete: true,
          nextStep: "complete",
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getAllByText("Coach verified")).toHaveLength(2);
    });
  });

  it("verify step saves certifications then submits verification", async () => {
    hookState.profileQuery.data = {
      coach: {
        id: "coach-1",
        name: "Coach Alex",
        tagline: "Private badminton sessions",
        bio: "Competitive player turned coach",
      },
      sports: [],
      certifications: [],
    };
    hookState.updateProfileMutateAsync.mockResolvedValue({
      coach: { id: "coach-1" },
    });
    hookState.submitVerificationMutateAsync.mockResolvedValue({
      coachId: "coach-1",
      verificationStatus: "PENDING",
    });

    const { rerender } = render(
      <VerifyStep
        status={{
          coachId: "coach-1",
          hasCoachProfile: true,
          hasCoachSports: true,
          hasCoachLocation: true,
          hasCoachSchedule: true,
          hasCoachPricing: true,
          hasPaymentMethod: true,
          hasVerification: false,
          verificationStatus: "UNVERIFIED",
          isSetupComplete: false,
          nextStep: "verify",
        }}
      />,
    );

    fireEvent.change(
      document.querySelector('input[name="certifications.0.name"]') as Element,
      {
        target: { value: "PTR" },
      },
    );
    fireEvent.change(
      document.querySelector(
        'input[name="certifications.0.issuingBody"]',
      ) as Element,
      {
        target: { value: "Professional Tennis Registry" },
      },
    );
    fireEvent.change(
      document.querySelector('input[name="certifications.0.level"]') as Element,
      {
        target: { value: "Level 1" },
      },
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Save certifications" }),
      ).toBeTruthy();
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Save certifications" }),
    );

    await waitFor(() => {
      expect(hookState.updateProfileMutateAsync).toHaveBeenCalledWith({
        certifications: [
          {
            name: "PTR",
            issuingBody: "Professional Tennis Registry",
            level: "Level 1",
          },
        ],
      });
    });

    hookState.profileQuery.data = {
      coach: {
        id: "coach-1",
        name: "Coach Alex",
        tagline: "Private badminton sessions",
        bio: "Competitive player turned coach",
      },
      sports: [],
      certifications: [
        {
          id: "cert-1",
          coachId: "coach-1",
          name: "PTR",
          issuingBody: "Professional Tennis Registry",
          level: "Level 1",
          createdAt: new Date("2026-03-15T00:00:00.000Z"),
        },
      ],
    };

    rerender(
      <VerifyStep
        status={{
          coachId: "coach-1",
          hasCoachProfile: true,
          hasCoachSports: true,
          hasCoachLocation: true,
          hasCoachSchedule: true,
          hasCoachPricing: true,
          hasPaymentMethod: true,
          hasVerification: false,
          verificationStatus: "UNVERIFIED",
          isSetupComplete: false,
          nextStep: "verify",
        }}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Submit for verification" }),
    );

    await waitFor(() => {
      expect(hookState.submitVerificationMutateAsync).toHaveBeenCalledOnce();
    });
  });
});
