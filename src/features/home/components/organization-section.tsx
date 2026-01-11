"use client";

import { ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { appRoutes } from "@/shared/lib/app-routes";

interface OrganizationSectionProps {
  organization: {
    id: string;
    name: string;
    slug: string;
  } | null;
  isLoading?: boolean;
}

export function OrganizationSection({
  organization,
  isLoading,
}: OrganizationSectionProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-24 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  if (organization) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Organization Dashboard</CardTitle>
          <CardDescription>Manage {organization.name}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border p-3">
              <p className="text-sm font-medium text-muted-foreground">
                Courts
              </p>
              {/* Mock count for now */}
              <p className="text-2xl font-bold">--</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-sm font-medium text-muted-foreground">
                Pending Requests
              </p>
              {/* Mock count for now */}
              <p className="text-2xl font-bold">--</p>
            </div>
          </div>
          <Button className="w-full" asChild>
            <Link href={appRoutes.owner.base}>
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardHeader>
        <CardTitle className="text-primary">Own a Court?</CardTitle>
        <CardDescription>
          List your facility on Kudos and manage reservations efficiently.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button className="w-full" asChild>
          <Link href={appRoutes.owner.onboarding}>
            <Plus className="mr-2 h-4 w-4" />
            Become a Partner
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
