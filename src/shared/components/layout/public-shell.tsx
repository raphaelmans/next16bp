import { Footer, Navbar } from "@/features/discovery/components";
import { cn } from "@/lib/utils";

interface PublicShellProps {
  children: React.ReactNode;
  className?: string;
}

export function PublicShell({ children, className }: PublicShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 rounded-md bg-background px-3 py-2 text-sm font-heading font-semibold text-foreground shadow-md"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main-content" className={cn("flex-1 w-full pt-24", className)}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
