"use client";

import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/features/auth/hooks/use-auth";
import { OrganizationForm } from "@/features/organization/components/organization-form";
import { KudosLogo } from "@/shared/components/kudos";
import { useTRPC } from "@/trpc/client";

export default function OnboardingPage() {
  const router = useRouter();
  const trpc = useTRPC();
  const { data: sessionUser, isLoading: sessionLoading } = useSession();
  const { data: orgs, isLoading: orgsLoading } = useQuery({
    ...trpc.organization.my.queryOptions(),
    enabled: !!sessionUser,
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!sessionLoading && !sessionUser) {
      router.push("/login?redirect=/owner/onboarding");
    }
  }, [sessionUser, sessionLoading, router]);

  // Redirect if user already has an org
  useEffect(() => {
    if (!orgsLoading && orgs && orgs.length > 0) {
      router.push("/owner");
    }
  }, [orgs, orgsLoading, router]);

  const handleSuccess = () => {
    router.push("/owner");
  };

  const handleCancel = () => {
    router.push("/home");
  };

  if (sessionLoading || orgsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">
          <KudosLogo size={48} variant="icon" />
        </div>
      </div>
    );
  }

  if (!sessionUser) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <KudosLogo size={36} variant="full" />
          </Link>
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <X className="h-5 w-5" />
            <span className="sr-only">Cancel</span>
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <OrganizationForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </main>

      {/* Footer */}
      <footer className="border-t py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          By creating an organization, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-foreground">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </Link>
        </div>
      </footer>
    </div>
  );
}
