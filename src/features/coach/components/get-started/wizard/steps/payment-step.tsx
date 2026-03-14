import { StepPlaceholder } from "./step-placeholder";

export function PaymentStep({ isComplete }: { isComplete: boolean }) {
  return (
    <StepPlaceholder
      eyebrow="Step 6"
      title="Add payment details"
      description="Coach payment method CRUD arrives later, but the setup contract already checks for active coach payment methods so the portal can unlock bookings once that module lands."
      bullets={[
        "Current readiness rule: at least one coach payment method",
        "Future UI: payment method manager and default account selection",
        "Payment setup remains distinct from pricing rules",
      ]}
      isComplete={isComplete}
    />
  );
}
