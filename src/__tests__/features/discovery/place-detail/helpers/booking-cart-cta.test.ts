import { describe, expect, it } from "vitest";
import {
  buildBookingSummaryCtaState,
  canCheckoutBookingCart,
} from "@/features/discovery/place-detail/helpers/booking-cart-cta";

describe("buildBookingSummaryCtaState", () => {
  it.each([
    {
      input: { cartItemCount: 0, hasSelection: false },
      expected: {
        variant: "outline",
        label: "Select a time",
        shouldProceed: false,
      },
    },
    {
      input: { cartItemCount: 0, hasSelection: true },
      expected: {
        variant: "default",
        label: "Continue to review",
        shouldProceed: true,
      },
    },
    {
      input: { cartItemCount: 1, hasSelection: false },
      expected: {
        variant: "default",
        label: "Continue to checkout (1)",
        shouldProceed: true,
      },
    },
    {
      input: { cartItemCount: 3, hasSelection: false },
      expected: {
        variant: "default",
        label: "Continue to checkout (3)",
        shouldProceed: true,
      },
    },
    {
      input: { cartItemCount: 2, hasSelection: true },
      expected: {
        variant: "outline",
        label: "Select a time",
        shouldProceed: false,
      },
    },
  ])("returns expected CTA for $input", ({ input, expected }) => {
    const result = buildBookingSummaryCtaState(input);
    expect(result).toEqual(expected);
  });
});

describe("canCheckoutBookingCart", () => {
  it("returns true when cart has at least one item and no active selection", () => {
    expect(
      canCheckoutBookingCart({ cartItemCount: 1, hasSelection: false }),
    ).toBe(true);
  });

  it("returns false when cart is empty", () => {
    expect(
      canCheckoutBookingCart({ cartItemCount: 0, hasSelection: false }),
    ).toBe(false);
  });

  it("returns false when there is an active selection", () => {
    expect(
      canCheckoutBookingCart({ cartItemCount: 1, hasSelection: true }),
    ).toBe(false);
  });
});
