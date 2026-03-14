import { StepPlaceholder } from "./step-placeholder";

export function PricingStep({ isComplete }: { isComplete: boolean }) {
  return (
    <StepPlaceholder
      eyebrow="Step 5"
      title="Define your pricing"
      description="Pricing editors arrive after the schedule module. This status already checks whether coach rate rules exist."
      bullets={[
        "Current readiness rule: at least one coach rate rule",
        "Future UI: time-window pricing and add-ons",
        "Pricing readiness is tracked separately from payment readiness",
      ]}
      isComplete={isComplete}
    />
  );
}
