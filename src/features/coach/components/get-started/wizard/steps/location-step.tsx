import { StepPlaceholder } from "./step-placeholder";

export function LocationStep({ isComplete }: { isComplete: boolean }) {
  return (
    <StepPlaceholder
      eyebrow="Step 3"
      title="Set your coaching location"
      description="Location is considered ready once your coach record has a city and province. Map pinning and travel preferences stay in the broader profile flow."
      bullets={[
        "Current readiness rule: city and province are present",
        "Future UI: map selection and precise travel coverage",
        "Public discovery will build on this status in later coach tasks",
      ]}
      isComplete={isComplete}
    />
  );
}
