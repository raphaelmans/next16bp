import { ExternalLink, Facebook, Globe, Instagram, Phone } from "lucide-react";
import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { formatCurrencyWhole } from "@/common/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CoachDetailContactProps {
  contactDetail: {
    phoneNumber?: string | null;
    facebookUrl?: string | null;
    instagramUrl?: string | null;
    websiteUrl?: string | null;
  } | null;
  coachIdOrSlug: string;
  rateInCents: number | null;
  currency: string;
}

export function CoachDetailContact({
  contactDetail,
  coachIdOrSlug,
  rateInCents,
  currency,
}: CoachDetailContactProps) {
  const phone = contactDetail?.phoneNumber?.trim();
  const facebook = contactDetail?.facebookUrl?.trim();
  const instagram = contactDetail?.instagramUrl?.trim();
  const website = contactDetail?.websiteUrl?.trim();
  const hasContactInfo = phone || facebook || instagram || website;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact &amp; Booking</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {rateInCents != null && (
          <div className="text-center">
            <div className="text-2xl font-bold">
              {formatCurrencyWhole(rateInCents, currency)}
            </div>
            <p className="text-sm text-muted-foreground">per hour</p>
          </div>
        )}

        <Button asChild className="w-full">
          <Link href={appRoutes.coaches.book(coachIdOrSlug)}>
            Book a session
          </Link>
        </Button>

        {hasContactInfo && (
          <div className="space-y-3 pt-2">
            {phone && (
              <a
                href={`tel:${phone}`}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <Phone className="h-4 w-4" />
                {phone}
              </a>
            )}
            {facebook && (
              <a
                href={facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <Facebook className="h-4 w-4" />
                Facebook
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {instagram && (
              <a
                href={instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <Instagram className="h-4 w-4" />
                Instagram
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {website && (
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <Globe className="h-4 w-4" />
                Website
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
