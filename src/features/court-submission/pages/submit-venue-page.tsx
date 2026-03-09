"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { useQueryAuthSession } from "@/features/auth/hooks";
import { SubmitVenueForm } from "../components/submit-venue-form";

export default function SubmitVenuePage() {
  const { data: sessionUser } = useQueryAuthSession();
  const isAuthenticated = !!sessionUser;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6 space-y-6">
      <PageHeader
        title="Submit a Venue"
        description="Know a venue that's not listed? Help us grow the directory by submitting it. Your submission will be reviewed before it goes live."
      />
      {!isAuthenticated && (
        <Alert className="border-amber-500/30 bg-amber-500/5">
          <AlertTriangle className="text-amber-700" />
          <AlertTitle>Sign-in required</AlertTitle>
          <AlertDescription className="gap-3">
            <p>
              Only authenticated users can submit a venue. If your session has
              expired, sign in again before sending this form.
            </p>
            <div>
              <Button asChild size="sm" variant="outline">
                <Link href={appRoutes.login.from(appRoutes.submitVenue.base)}>
                  Sign in
                </Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      <SubmitVenueForm />
    </div>
  );
}
