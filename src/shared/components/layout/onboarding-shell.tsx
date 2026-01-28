"use client";

import Link from "next/link";
import { ArrowLeftRight, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/features/auth/hooks/use-auth";
import { KudosLogo } from "@/shared/components/kudos";
import { appRoutes } from "@/shared/lib/app-routes";

export function OnboardingShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { mutate: logout } = useLogout();

  const handleSignOut = () => {
    logout(undefined, {
      onSuccess: () => {
        router.push(appRoutes.index.base);
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href={appRoutes.index.base} className="flex items-center gap-2">
            <KudosLogo size={28} variant="full" />
          </Link>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild>
              <a href={appRoutes.home.base}>
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                Player View
              </a>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-muted-foreground"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 w-full">{children}</main>
    </div>
  );
}
