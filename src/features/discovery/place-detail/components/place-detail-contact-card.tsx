"use client";

import { Copy, ExternalLink, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PlaceContactDetail } from "@/features/discovery/hooks";

type PlaceDetailContactCardProps = {
  hasContactDetail: boolean;
  contactDetail?: PlaceContactDetail;
  phoneNumber?: string;
  dialablePhone: string;
  viberNumber?: string;
  viberLink: string;
  onCopyPhone?: () => void;
  onCopyViber?: () => void;
};

export function PlaceDetailContactCard({
  hasContactDetail,
  contactDetail,
  phoneNumber,
  dialablePhone,
  viberNumber,
  viberLink,
  onCopyPhone,
  onCopyViber,
}: PlaceDetailContactCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {!hasContactDetail && (
          <p className="text-muted-foreground">
            Contact details are not available yet.
          </p>
        )}
        {phoneNumber && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-muted-foreground">Phone</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={`tel:${dialablePhone || phoneNumber}`}>
                  <Phone className="h-4 w-4" />
                  {phoneNumber}
                </a>
              </Button>
              {onCopyPhone ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Copy phone number"
                  onClick={onCopyPhone}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </div>
        )}
        {contactDetail?.websiteUrl && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-muted-foreground">Website</span>
            <a
              href={contactDetail.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              Visit
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
        {contactDetail?.facebookUrl && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-muted-foreground">Facebook</span>
            <a
              href={contactDetail.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              View
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
        {contactDetail?.instagramUrl && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-muted-foreground">Instagram</span>
            <a
              href={contactDetail.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              View
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
        {viberNumber && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-muted-foreground">Viber</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={viberLink || `viber://chat?number=${viberNumber}`}>
                  <Phone className="h-4 w-4" />
                  {viberNumber}
                </a>
              </Button>
              {onCopyViber ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Copy Viber number"
                  onClick={onCopyViber}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </div>
        )}
        {contactDetail?.otherContactInfo && (
          <div className="space-y-1">
            <span className="text-muted-foreground">Other</span>
            <p className="text-sm">{contactDetail.otherContactInfo}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
