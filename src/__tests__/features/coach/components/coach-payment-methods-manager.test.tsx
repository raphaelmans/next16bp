import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const hookState = vi.hoisted(() => ({
  query: {
    data: { methods: [] as Array<Record<string, unknown>> },
    isLoading: false,
  },
  createMutateAsync: vi.fn(),
  updateMutateAsync: vi.fn(),
  deleteMutateAsync: vi.fn(),
  setDefaultMutateAsync: vi.fn(),
}));

vi.mock("@/features/coach/hooks", () => ({
  useQueryCoachPaymentMethods: () => hookState.query,
  useMutCreateCoachPaymentMethod: () => ({
    mutateAsync: hookState.createMutateAsync,
    isPending: false,
  }),
  useMutUpdateCoachPaymentMethod: () => ({
    mutateAsync: hookState.updateMutateAsync,
    isPending: false,
  }),
  useMutDeleteCoachPaymentMethod: () => ({
    mutateAsync: hookState.deleteMutateAsync,
    isPending: false,
  }),
  useMutSetDefaultCoachPaymentMethod: () => ({
    mutateAsync: hookState.setDefaultMutateAsync,
    isPending: false,
  }),
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock("@/common/toast", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

vi.mock("@/common/toast/errors", () => ({
  getClientErrorMessage: () => "Please try again",
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: { open: boolean; children: ReactNode }) =>
    open ? <div>{children}</div> : null,
  DialogContent: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  DialogDescription: ({ children }: { children: ReactNode }) => (
    <p>{children}</p>
  ),
  DialogFooter: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  DialogHeader: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}));

vi.mock("@/components/ui/alert-dialog", () => ({
  AlertDialog: ({ open, children }: { open: boolean; children: ReactNode }) =>
    open ? <div>{children}</div> : null,
  AlertDialogAction: ({
    children,
    loading: _loading,
    ...props
  }: ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
  AlertDialogCancel: ({
    children,
    ...props
  }: ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
  AlertDialogContent: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogDescription: ({ children }: { children: ReactNode }) => (
    <p>{children}</p>
  ),
  AlertDialogFooter: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogHeader: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogTitle: ({ children }: { children: ReactNode }) => (
    <h2>{children}</h2>
  ),
}));

import { CoachPaymentMethodsManager } from "@/features/coach/components/coach-payment-methods-manager";

describe("CoachPaymentMethodsManager", () => {
  beforeAll(() => {
    globalThis.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  beforeEach(() => {
    hookState.query = {
      data: { methods: [] },
      isLoading: false,
    };
    hookState.createMutateAsync.mockReset();
    hookState.updateMutateAsync.mockReset();
    hookState.deleteMutateAsync.mockReset();
    hookState.setDefaultMutateAsync.mockReset();
    toastSuccess.mockReset();
    toastError.mockReset();
  });

  it("creates a payment method", async () => {
    hookState.createMutateAsync.mockResolvedValue({
      method: { id: "payment-1" },
    });

    render(<CoachPaymentMethodsManager coachId="coach-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Add Payment Method" }));
    const accountNameInput = document.querySelector(
      'input[name="accountName"]',
    );
    const accountNumberInput = document.querySelector(
      'input[name="accountNumber"]',
    );
    const instructionsInput = document.querySelector(
      'textarea[name="instructions"]',
    );

    expect(accountNameInput).toBeTruthy();
    expect(accountNumberInput).toBeTruthy();
    expect(instructionsInput).toBeTruthy();

    fireEvent.change(accountNameInput as Element, {
      target: { value: " Coach One " },
    });
    fireEvent.change(accountNumberInput as Element, {
      target: { value: " 09171234567 " },
    });
    fireEvent.change(instructionsInput as Element, {
      target: { value: " Use reservation ID " },
    });
    fireEvent.blur(accountNameInput as Element);
    fireEvent.blur(accountNumberInput as Element);

    await waitFor(() => {
      expect(
        (
          screen.getByRole("button", {
            name: "Add Method",
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(false);
    });
    fireEvent.click(screen.getByRole("button", { name: "Add Method" }));

    await waitFor(() => {
      expect(hookState.createMutateAsync).toHaveBeenCalledWith({
        coachId: "coach-1",
        type: "MOBILE_WALLET",
        provider: "GCASH",
        accountName: "Coach One",
        accountNumber: "09171234567",
        instructions: "Use reservation ID",
        isDefault: false,
        isActive: true,
      });
    });
  });

  it("updates a payment method", async () => {
    hookState.query.data = {
      methods: [
        {
          id: "payment-1",
          type: "MOBILE_WALLET",
          provider: "GCASH",
          accountName: "Coach One",
          accountNumber: "09171234567",
          instructions: "Old instructions",
          isActive: true,
          isDefault: false,
          displayOrder: 0,
        },
      ],
    };
    hookState.updateMutateAsync.mockResolvedValue({
      method: { id: "payment-1" },
    });

    render(<CoachPaymentMethodsManager coachId="coach-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    const accountNameInput = document.querySelector(
      'input[name="accountName"]',
    );

    expect(accountNameInput).toBeTruthy();

    fireEvent.change(accountNameInput as Element, {
      target: { value: "Coach Prime" },
    });
    fireEvent.blur(accountNameInput as Element);

    await waitFor(() => {
      expect(
        (
          screen.getByRole("button", {
            name: "Save Changes",
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(false);
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(hookState.updateMutateAsync).toHaveBeenCalledWith({
        paymentMethodId: "payment-1",
        type: "MOBILE_WALLET",
        provider: "GCASH",
        accountName: "Coach Prime",
        accountNumber: "09171234567",
        instructions: "Old instructions",
        isDefault: false,
        isActive: true,
      });
    });
  });

  it("sets a method as default", async () => {
    hookState.query.data = {
      methods: [
        {
          id: "payment-1",
          type: "MOBILE_WALLET",
          provider: "GCASH",
          accountName: "Coach One",
          accountNumber: "09171234567",
          instructions: null,
          isActive: true,
          isDefault: false,
          displayOrder: 0,
        },
      ],
    };
    hookState.setDefaultMutateAsync.mockResolvedValue({ success: true });

    render(<CoachPaymentMethodsManager coachId="coach-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Set Default" }));

    await waitFor(() => {
      expect(hookState.setDefaultMutateAsync).toHaveBeenCalledWith({
        paymentMethodId: "payment-1",
      });
    });
  });

  it("deletes a payment method after confirmation", async () => {
    hookState.query.data = {
      methods: [
        {
          id: "payment-1",
          type: "MOBILE_WALLET",
          provider: "GCASH",
          accountName: "Coach One",
          accountNumber: "09171234567",
          instructions: null,
          isActive: true,
          isDefault: false,
          displayOrder: 0,
        },
      ],
    };
    hookState.deleteMutateAsync.mockResolvedValue({ success: true });

    render(<CoachPaymentMethodsManager coachId="coach-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => {
      expect(screen.getByText("Delete Payment Method")).toBeTruthy();
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Delete" })[1]);

    await waitFor(() => {
      expect(hookState.deleteMutateAsync).toHaveBeenCalledWith({
        paymentMethodId: "payment-1",
      });
    });
  });
});
