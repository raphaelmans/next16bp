import { StepPlaceholder } from "./step-placeholder";

export function SportsStep({ isComplete }: { isComplete: boolean }) {
  return (
    <StepPlaceholder
      eyebrow="Step 2"
      title="Choose your sports"
      description="The wizard will persist sports, specialties, skill levels, age groups, session types, and durations. This foundation currently checks whether you already have at least one sport linked."
      bullets={[
        "Current readiness rule: at least one linked sport",
        "Future UI: specialties, skill levels, age groups, and session formats",
        "Setup status now exposes this step separately from profile readiness",
      ]}
      isComplete={isComplete}
    />
  );
}
