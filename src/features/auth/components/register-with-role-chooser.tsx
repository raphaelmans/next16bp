"use client";

import { Building2, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { appRoutes } from "@/common/app-routes";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RegisterForm } from "./register-form";

function hasOwnerIntent(redirectParam: string | null): boolean {
  if (!redirectParam) return false;
  return redirectParam.startsWith("/owner");
}

export interface RegisterWithRoleChooserProps {
  redirectParam?: string | null;
}

export function RegisterWithRoleChooser({
  redirectParam = null,
}: RegisterWithRoleChooserProps) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<"player" | null>(null);

  const ownerIntent = hasOwnerIntent(redirectParam);
  const ownerRegisterUrl = `${appRoutes.register.owner}?redirect=${encodeURIComponent(appRoutes.owner.getStarted)}`;

  if (ownerIntent || selectedRole === "player") {
    return <RegisterForm redirectParam={redirectParam} />;
  }

  return (
    <div className="w-full max-w-md space-y-4">
      <Card>
        <CardHeader className="text-center">
          <CardTitle>How will you use KudosCourts?</CardTitle>
          <CardDescription>Choose how you want to get started</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <button
            type="button"
            onClick={() => setSelectedRole("player")}
            className="flex items-start gap-4 rounded-xl border border-border/60 bg-card p-4 text-left transition-colors hover:border-primary hover:bg-primary/5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="font-heading text-sm font-semibold">
                I want to book courts
              </p>
              <p className="text-sm text-muted-foreground">
                Find and reserve courts at venues near you.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => router.push(ownerRegisterUrl)}
            className="flex items-start gap-4 rounded-xl border border-border/60 bg-card p-4 text-left transition-colors hover:border-accent hover:bg-accent/5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="font-heading text-sm font-semibold">
                I want to list my venue
              </p>
              <p className="text-sm text-muted-foreground">
                List your courts, accept bookings, and manage reservations.
              </p>
            </div>
          </button>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={appRoutes.login.base}
          className="text-primary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
