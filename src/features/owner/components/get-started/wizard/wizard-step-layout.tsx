import type { ReactNode } from "react";

interface WizardStepLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function WizardStepLayout({
  title,
  description,
  children,
}: WizardStepLayoutProps) {
  return (
    <div className="animate-fade-in-up mx-auto w-full max-w-2xl space-y-6 px-4 py-6">
      <div className="space-y-1">
        <h2 className="text-xl font-heading font-semibold tracking-tight sm:text-2xl">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div>{children}</div>
    </div>
  );
}
