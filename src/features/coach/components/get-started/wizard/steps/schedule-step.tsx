import { StepPlaceholder } from "./step-placeholder";

export function ScheduleStep({ isComplete }: { isComplete: boolean }) {
  return (
    <StepPlaceholder
      eyebrow="Step 4"
      title="Add weekly availability"
      description="Schedule editing arrives in Step 4. The wizard foundation already knows whether weekly availability windows exist for this coach."
      bullets={[
        "Current readiness rule: at least one weekly hours window",
        "Future UI: visual availability grid and ad-hoc blocks",
        "Availability calculation will build directly on this step",
      ]}
      isComplete={isComplete}
    />
  );
}
