import { Star } from "lucide-react";
import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { Button } from "@/components/ui/button";

export function FeaturedPlaceholderCard() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-primary/5 p-6 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Star className="h-6 w-6" />
      </div>
      <h3 className="font-heading text-lg font-semibold text-foreground">
        Get Your Venue Featured
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Reach thousands of players. Featured venues get priority visibility and
        more bookings.
      </p>
      <Button asChild variant="default" size="sm" className="mt-4">
        <Link href={appRoutes.listYourVenue.base}>List Your Venue — Free</Link>
      </Button>
    </div>
  );
}
