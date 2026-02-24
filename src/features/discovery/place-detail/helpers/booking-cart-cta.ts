type BookingCartCtaInput = {
  cartItemCount: number;
  hasSelection: boolean;
};

export type BookingSummaryCtaState = {
  variant: "default" | "outline";
  label: string;
  shouldProceed: boolean;
};

export function canCheckoutBookingCart({
  cartItemCount,
  hasSelection,
}: BookingCartCtaInput): boolean {
  return cartItemCount > 0 && !hasSelection;
}

export function buildBookingSummaryCtaState({
  cartItemCount,
  hasSelection,
}: BookingCartCtaInput): BookingSummaryCtaState {
  if (canCheckoutBookingCart({ cartItemCount, hasSelection })) {
    return {
      variant: "default",
      label: `Continue to checkout (${cartItemCount})`,
      shouldProceed: true,
    };
  }

  if (hasSelection && cartItemCount === 0) {
    return {
      variant: "default",
      label: "Continue to review",
      shouldProceed: true,
    };
  }

  return {
    variant: "outline",
    label: "Select a time",
    shouldProceed: false,
  };
}
