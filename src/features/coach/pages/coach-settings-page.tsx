"use client";

import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PortalPreferenceCard } from "@/features/auth/components";
import { WebPushSettingsCard } from "@/features/notifications/components/web-push-settings";

export default function CoachSettingsPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <Badge variant="secondary">Coach settings</Badge>
            <h2 className="font-heading text-3xl font-semibold text-foreground">
              Manage workspace preferences
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Control how this device receives browser notifications and which
              portal KudosCourts should open by default when you come back.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={appRoutes.account.profile}>Open account profile</Link>
          </Button>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <WebPushSettingsCard />

          <Card>
            <CardHeader>
              <CardTitle>Account details</CardTitle>
              <CardDescription>
                Your legal name, avatar, and contact fields still live in the
                shared account profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href={appRoutes.account.profile}>
                  Edit account profile
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <PortalPreferenceCard />
      </div>
    </div>
  );
}
