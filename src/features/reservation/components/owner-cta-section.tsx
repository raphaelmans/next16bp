"use client";

import { ArrowRight, Building2, Plus } from "lucide-react";
import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/trpc/client";

export function OwnerCtaSection() {
  const { data: orgs, isLoading } = trpc.organization.my.useQuery();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const organization = orgs?.[0];

  if (organization) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Your Organization
          </CardTitle>
          <CardDescription>You own {organization.name}</CardDescription>
        </CardHeader>
        <CardContent>
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
        <CardTitle className="flex items-center gap-2 text-primary">
          <Building2 className="h-5 w-5" />
          Own a Court?
        </CardTitle>
        <CardDescription>
          List your pickleball or multi-sport venue on Kudos and start managing
          reservations easily.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button className="w-full" asChild>
          <Link href={appRoutes.ownersGetStarted.base}>
            <Plus className="mr-2 h-4 w-4" />
            Become a Partner
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
