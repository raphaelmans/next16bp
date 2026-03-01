import { ArrowRight, PartyPopper } from "lucide-react";
import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function SetupCompleteBanner() {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <PartyPopper className="h-6 w-6" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="font-heading font-semibold">You&apos;re all set!</p>
            <p className="text-sm text-muted-foreground">
              Your venue is verified and confirmed to accept bookings on
              KudosCourts.
            </p>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href={appRoutes.organization.bookings}>
              Manage reservations
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
