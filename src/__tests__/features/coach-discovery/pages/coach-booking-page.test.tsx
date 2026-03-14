import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const SLOT_START = "2099-01-15T09:00:00.000Z";
const SLOT_END = "2099-01-15T10:00:00.000Z";

const {
  routerPushSpy,
  mutateSpy,
  availabilityInputs,
  coachDetailState,
  coachAddonState,
} = vi.hoisted(() => ({
  routerPushSpy: vi.fn(),
  mutateSpy: vi.fn(),
  availabilityInputs: [] as Array<Record<string, unknown>>,
  coachDetailState: {
    data: {
      coach: {
        id: "coach-1",
        slug: "coach-carla",
        name: "Coach Carla",
        timeZone: "UTC",
        baseHourlyRateCents: 150000,
        baseHourlyRateCurrency: "PHP",
      },
      sessionDurations: [{ duration: 60 }],
      meta: {
        sports: [{ id: "sport-1", name: "Tennis" }],
      },
      media: {
        avatarUrl: null,
      },
    } as Record<string, unknown> | null,
    isLoading: false,
  },
  coachAddonState: {
    data: [
      {
        addon: {
          id: "addon-1",
          label: "Warm-up drills",
          isActive: true,
          mode: "OPTIONAL",
          pricingType: "FLAT",
          flatFeeCents: 10000,
          displayOrder: 0,
        },
        rules: [],
      },
    ] as Array<Record<string, unknown>>,
    isLoading: false,
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerPushSpy,
  }),
}));

vi.mock("@/components/ui/calendar", () => ({
  Calendar: ({ onSelect }: { onSelect?: (date: Date) => void }) => (
    <button
      type="button"
      onClick={() => onSelect?.(new Date("2099-01-15T00:00:00.000Z"))}
    >
      Pick date
    </button>
  ),
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  SelectItem: ({ children, value }: { children: ReactNode; value: string }) => (
    <button type="button">{`${children}-${value}`}</button>
  ),
  SelectTrigger: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => (
    <span>{placeholder}</span>
  ),
}));

vi.mock("@/components/ui/checkbox", () => ({
  Checkbox: ({
    checked,
    onCheckedChange,
    id,
  }: {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    id?: string;
  }) => (
    <input
      id={id}
      aria-label={id}
      type="checkbox"
      checked={checked}
      onChange={(event) => onCheckedChange?.(event.target.checked)}
    />
  ),
}));

vi.mock("@/features/court-addons", () => ({
  getAutoAddonIds: (addons: Array<{ addon: { id: string; mode: string } }>) =>
    addons
      .filter((config) => config.addon.mode === "AUTO")
      .map((config) => config.addon.id),
  sanitizeSelectedAddons: (
    selectedAddons: Array<{ addonId: string; quantity: number }>,
    addons: Array<{ addon: { id: string; isActive: boolean } }>,
  ) => {
    const allowedIds = new Set(
      addons
        .filter((config) => config.addon.isActive)
        .map((config) => config.addon.id),
    );
    const deduped = new Map<string, { addonId: string; quantity: number }>();
    for (const addon of selectedAddons) {
      if (allowedIds.has(addon.addonId)) {
        deduped.set(addon.addonId, addon);
      }
    }
    return Array.from(deduped.values());
  },
  PlayerAddonSelector: ({
    onSelectedAddonsChange,
  }: {
    onSelectedAddonsChange: (
      addons: Array<{ addonId: string; quantity: number }>,
    ) => void;
  }) => (
    <button
      type="button"
      onClick={() =>
        onSelectedAddonsChange([{ addonId: "addon-1", quantity: 2 }])
      }
    >
      Add warm-up drills
    </button>
  ),
}));

vi.mock("@/features/reservation/components/profile-preview-card", () => ({
  ProfilePreviewCard: () => <div>Profile preview</div>,
}));

vi.mock("@/features/reservation/components/profile-setup-modal", () => ({
  ProfileSetupModal: () => null,
}));

vi.mock("@/features/reservation/hooks", () => ({
  useQueryProfile: () => ({
    data: {
      displayName: "Player One",
      email: "player@example.com",
      phoneNumber: "+63 900 000 0000",
      avatarUrl: null,
    },
  }),
}));

vi.mock("@/features/coach-discovery/hooks/availability", () => ({
  useModCoachDetail: () => coachDetailState,
  useModCoachAddonsForBooking: () => coachAddonState,
  useModCoachAvailability: (input: Record<string, unknown>) => {
    availabilityInputs.push(input);
    const hasSelectedAddons = Array.isArray(input.selectedAddons);
    return {
      data:
        input.date && input.coachId
          ? {
              options: [
                {
                  startTime: SLOT_START,
                  endTime: SLOT_END,
                  totalPriceCents: hasSelectedAddons ? 170000 : 150000,
                  currency: "PHP",
                  coachId: "coach-1",
                  coachName: "Coach Carla",
                  status: "AVAILABLE",
                  pricingWarnings: [],
                  pricingBreakdown: {
                    basePriceCents: 150000,
                    addonPriceCents: hasSelectedAddons ? 20000 : 0,
                    totalPriceCents: hasSelectedAddons ? 170000 : 150000,
                    addons: hasSelectedAddons
                      ? [
                          {
                            addonId: "addon-1",
                            addonLabel: "Warm-up drills",
                            pricingType: "FLAT",
                            quantity: 2,
                            subtotalCents: 20000,
                          },
                        ]
                      : [],
                  },
                },
              ],
              diagnostics: {
                hasHoursWindows: true,
                hasRateRules: true,
                dayHasHours: true,
                allSlotsBooked: false,
              },
            }
          : {
              options: [],
              diagnostics: {
                hasHoursWindows: true,
                hasRateRules: true,
                dayHasHours: true,
                allSlotsBooked: false,
              },
            },
      isLoading: false,
      isFetching: false,
    };
  },
}));

vi.mock("@/features/coach-discovery/hooks/booking", () => ({
  useMutCreateReservationForCoach: () => ({
    mutate: mutateSpy,
    isPending: false,
  }),
}));

import CoachBookingPage from "@/features/coach-discovery/pages/coach-booking-page";

describe("CoachBookingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    availabilityInputs.length = 0;
  });

  it("updates the booking summary when a coach add-on is selected", async () => {
    render(<CoachBookingPage coachIdOrSlug="coach-carla" />);

    fireEvent.click(screen.getByRole("button", { name: "Pick date" }));
    fireEvent.click(screen.getByRole("button", { name: "9:00 AM" }));

    expect(screen.getAllByText("₱1,500.00").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Add warm-up drills" }));

    await waitFor(() => {
      expect(screen.getByText("Warm-up drills x2")).toBeTruthy();
    });

    expect(screen.getAllByText("₱1,700.00").length).toBeGreaterThan(0);
    expect(availabilityInputs.at(-1)?.selectedAddons).toEqual([
      { addonId: "addon-1", quantity: 2 },
    ]);
  });

  it("passes selected coach add-ons through the booking mutation payload", async () => {
    render(<CoachBookingPage coachIdOrSlug="coach-carla" />);

    fireEvent.click(screen.getByRole("button", { name: "Pick date" }));
    fireEvent.click(screen.getByRole("button", { name: "9:00 AM" }));
    fireEvent.click(screen.getByRole("button", { name: "Add warm-up drills" }));
    fireEvent.click(screen.getByLabelText("terms"));
    fireEvent.click(screen.getByRole("button", { name: "Confirm Booking" }));

    await waitFor(() => {
      expect(mutateSpy).toHaveBeenCalledWith(
        {
          coachId: "coach-1",
          startTime: SLOT_START,
          durationMinutes: 60,
          selectedAddons: [{ addonId: "addon-1", quantity: 2 }],
        },
        expect.objectContaining({
          onSuccess: expect.any(Function),
        }),
      );
    });
  });
});
