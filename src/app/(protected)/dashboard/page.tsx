"use client";

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
import { useLogout, useSession } from "@/features/auth";

export default function DashboardPage() {
  const { data: user, isLoading } = useSession();
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.base;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome back!</CardTitle>
        <CardDescription>You are logged in as {user?.email}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-muted-foreground text-sm">
          <p>
            <strong>User ID:</strong> {user?.id}
          </p>
          <p>
            <strong>Role:</strong> {user?.role}
          </p>
        </div>
        <Link
          href={appRoutes.account.profile}
          className="text-primary text-sm hover:underline"
        >
          Edit Profile
        </Link>
        <Button
          variant="outline"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          {logoutMutation.isPending ? "Signing out..." : "Sign Out"}
        </Button>
      </CardContent>
    </Card>
  );
}
