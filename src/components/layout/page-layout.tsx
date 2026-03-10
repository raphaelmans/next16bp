import { cn } from "@/lib/utils";
import { Container } from "./container";

interface PageLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Add top padding to account for fixed navbar */
  hasNavbar?: boolean;
  /** Container size */
  containerSize?: "sm" | "md" | "lg" | "xl" | "full";
}

export function PageLayout({
  hasNavbar = true,
  containerSize = "full",
  className,
  children,
  ...props
}: PageLayoutProps) {
  return (
    <main
      className={cn(
        "min-h-dvh",
        hasNavbar && "pt-24", // Account for fixed navbar
        className,
      )}
      {...props}
    >
      <Container size={containerSize}>{children}</Container>
    </main>
  );
}

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  actions,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-8",
        className,
      )}
      {...props}
    >
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="mt-4 sm:mt-0">{actions}</div>}
    </div>
  );
}

interface PageSectionProps extends React.HTMLAttributes<HTMLElement> {
  title?: string;
  description?: string;
}

export function PageSection({
  title,
  description,
  className,
  children,
  ...props
}: PageSectionProps) {
  return (
    <section className={cn("py-8", className)} {...props}>
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          )}
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
