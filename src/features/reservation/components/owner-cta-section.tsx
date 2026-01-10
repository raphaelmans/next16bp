"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Building2, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/trpc/client";

export function OwnerCtaSection() {
  const trpc = useTRPC();

  const { data: orgs, isLoading } = useQuery(
    trpc.organization.my.queryOptions(),
  );

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
            <Link href="/owner">
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
          List your pickleball facility on Kudos and start managing reservations
          easily.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button className="w-full" asChild>
          <Link href="/owner/onboarding">
            <Plus className="mr-2 h-4 w-4" />
            Become a Partner
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
