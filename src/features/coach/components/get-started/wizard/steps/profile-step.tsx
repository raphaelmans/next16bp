import { StepPlaceholder } from "./step-placeholder";

export function ProfileStep({ isComplete }: { isComplete: boolean }) {
  return (
    <StepPlaceholder
      eyebrow="Step 1"
      title="Build your coach profile"
      description="Profile saving from the full wizard lands next. This shell already reflects whether your current coach record has the required profile basics."
      bullets={[
        "Required for completion: name, tagline, and bio",
        "Planned here next: profile photo and intro video upload",
        "Status already reads from your saved coach record",
      ]}
      isComplete={isComplete}
    />
  );
}
