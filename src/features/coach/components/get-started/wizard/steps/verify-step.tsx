import { StepPlaceholder } from "./step-placeholder";

export function VerifyStep({ isComplete }: { isComplete: boolean }) {
  return (
    <StepPlaceholder
      eyebrow="Step 7"
      title="Verification placeholder"
      description="The initial release does not block coach setup on an extra verification flow. This step stays visible in the shell so the final wizard structure is stable before the real certification flow ships."
      bullets={[
        "Current readiness rule: satisfied by default in v1",
        "Future UI: certification upload and review state",
        "This prevents the setup contract from dead-ending before Step 13 exists",
      ]}
      isComplete={isComplete}
    />
  );
}
