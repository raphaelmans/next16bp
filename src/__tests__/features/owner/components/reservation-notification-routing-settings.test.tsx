import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  toastSuccessSpy,
  toastErrorSpy,
  preferenceState,
  routingStatusState,
  setPreferenceState,
} = vi.hoisted(() => ({
  toastSuccessSpy: vi.fn(),
  toastErrorSpy: vi.fn(),
  preferenceState: {
    data: { enabled: false, canReceive: true } as
      | { enabled: boolean; canReceive: boolean }
      | undefined,
    isLoading: false,
  },
  routingStatusState: {
    data: { enabledRecipientCount: 1 } as
      | { enabledRecipientCount: number }
      | undefined,
    isLoading: false,
  },
  setPreferenceState: {
    mutateAsync: vi.fn(async () => undefined),
    isPending: false,
  },
}));

vi.mock("@/features/owner/hooks", () => ({
  useQueryMyReservationNotificationPreference: () => preferenceState,
  useQueryReservationNotificationRoutingStatus: () => routingStatusState,
  useMutSetMyReservationNotificationPreference: () => setPreferenceState,
}));

vi.mock("@/common/toast", () => ({
  toast: {
    success: toastSuccessSpy,
    error: toastErrorSpy,
  },
}));

vi.mock("@/common/toast/errors", () => ({
  getClientErrorMessage: () => "Please try again",
}));

vi.mock("@/components/ui/switch", () => ({
  Switch: ({
    checked,
    disabled,
    onCheckedChange,
    "aria-label": ariaLabel,
  }: {
    checked: boolean;
    disabled?: boolean;
    onCheckedChange: (checked: boolean) => void;
    "aria-label": string;
  }) => (
    <button
      aria-label={ariaLabel}
      data-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      type="button"
    >
      toggle
    </button>
  ),
}));

import { ReservationNotificationRoutingSettings } from "@/features/owner/components/reservation-notification-routing-settings";

describe("ReservationNotificationRoutingSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    preferenceState.data = { enabled: false, canReceive: true };
    preferenceState.isLoading = false;
    routingStatusState.data = { enabledRecipientCount: 1 };
    routingStatusState.isLoading = false;
    setPreferenceState.isPending = false;
  });

  it("shows loading state while routing data is syncing", () => {
    preferenceState.isLoading = true;

    render(<ReservationNotificationRoutingSettings organizationId="org-1" />);

    expect(
      screen.getByText("Syncing notification routing status..."),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", {
        name: "Toggle reservation notification routing",
      }),
    ).toHaveProperty("disabled", true);
  });

  it("renders ready state and enabled recipient count", () => {
    preferenceState.data = { enabled: true, canReceive: true };
    routingStatusState.data = { enabledRecipientCount: 3 };

    render(<ReservationNotificationRoutingSettings organizationId="org-1" />);

    expect(screen.getByText("Enabled recipients:")).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
    expect(
      screen.getByRole("button", {
        name: "Toggle reservation notification routing",
      }),
    ).toHaveProperty("disabled", false);
  });

  it("shows permission hint and disables toggle when user cannot receive notifications", () => {
    preferenceState.data = { enabled: false, canReceive: false };
    routingStatusState.data = { enabledRecipientCount: 0 };

    render(<ReservationNotificationRoutingSettings organizationId="org-1" />);

    expect(screen.getByText(/reservation\.notification\.receive/)).toBeTruthy();
    expect(
      screen.queryByText(/No recipients are currently enabled/),
    ).toBeNull();
    expect(
      screen.getByRole("button", {
        name: "Toggle reservation notification routing",
      }),
    ).toHaveProperty("disabled", true);
  });

  it("shows team access CTA when user cannot receive notifications and a team link is provided", () => {
    preferenceState.data = { enabled: false, canReceive: false };
    routingStatusState.data = { enabledRecipientCount: 0 };

    render(
      <ReservationNotificationRoutingSettings
        organizationId="org-1"
        teamAccessHref="/organization/team"
      />,
    );

    expect(
      screen
        .getByRole("link", { name: "Open Team & Access" })
        .getAttribute("href"),
    ).toBe("/organization/team");
  });

  it("shows muted warning when eligible user has zero enabled recipients", () => {
    preferenceState.data = { enabled: false, canReceive: true };
    routingStatusState.data = { enabledRecipientCount: 0 };

    render(<ReservationNotificationRoutingSettings organizationId="org-1" />);

    expect(
      screen.getByText(/No recipients are currently enabled/),
    ).toBeTruthy();
    expect(screen.queryByText(/reservation\.notification\.receive/)).toBeNull();
  });

  it("toggle success shows success toast and forwards mutation payload", async () => {
    render(<ReservationNotificationRoutingSettings organizationId="org-1" />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Toggle reservation notification routing",
      }),
    );

    await waitFor(() => {
      expect(setPreferenceState.mutateAsync).toHaveBeenCalledWith({
        organizationId: "org-1",
        enabled: true,
      });
    });
    expect(toastSuccessSpy).toHaveBeenCalledWith(
      "Reservation notifications enabled",
    );
  });

  it("toggle failure shows error toast and does not show success", async () => {
    setPreferenceState.mutateAsync.mockRejectedValueOnce(new Error("failed"));

    render(<ReservationNotificationRoutingSettings organizationId="org-1" />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Toggle reservation notification routing",
      }),
    );

    await waitFor(() => {
      expect(toastErrorSpy).toHaveBeenCalledWith(
        "Failed to update notification preference",
        {
          description: "Please try again",
        },
      );
    });
    expect(toastSuccessSpy).not.toHaveBeenCalled();
  });
});
