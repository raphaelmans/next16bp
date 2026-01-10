"use client";

import { ExternalLink, Facebook, Globe, Instagram, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SocialLinks {
  facebook?: string;
  instagram?: string;
  viber?: string;
  website?: string;
  phone?: string;
}

interface ContactSectionProps {
  courtName: string;
  socialLinks: SocialLinks;
  className?: string;
}

export function ContactSection({
  courtName: _courtName,
  socialLinks,
  className,
}: ContactSectionProps) {
  const hasAnyLink = Object.values(socialLinks).some(Boolean);

  if (!hasAnyLink) {
    return null;
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Contact to Book</CardTitle>
          <Badge variant="contact">Curated</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          This court is managed externally. Contact them directly to book.
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {socialLinks.phone && (
          <Button variant="outline" className="w-full justify-start" asChild>
            <a href={`tel:${socialLinks.phone}`}>
              <Phone className="h-4 w-4 mr-3" />
              {socialLinks.phone}
            </a>
          </Button>
        )}

        {socialLinks.facebook && (
          <Button
            variant="outline"
            className="w-full justify-start group"
            asChild
          >
            <a
              href={socialLinks.facebook}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Facebook className="h-4 w-4 mr-3 group-hover:text-[#1877F2]" />
              Facebook Page
              <ExternalLink className="h-3 w-3 ml-auto" />
            </a>
          </Button>
        )}

        {socialLinks.instagram && (
          <Button
            variant="outline"
            className="w-full justify-start group"
            asChild
          >
            <a
              href={socialLinks.instagram}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Instagram className="h-4 w-4 mr-3 group-hover:text-[#E4405F]" />
              Instagram
              <ExternalLink className="h-3 w-3 ml-auto" />
            </a>
          </Button>
        )}

        {socialLinks.viber && (
          <Button
            variant="outline"
            className="w-full justify-start group"
            asChild
          >
            <a href={`viber://chat?number=${socialLinks.viber}`}>
              <Phone className="h-4 w-4 mr-3 group-hover:text-[#7360F2]" />
              Viber
              <ExternalLink className="h-3 w-3 ml-auto" />
            </a>
          </Button>
        )}

        {socialLinks.website && (
          <Button
            variant="outline"
            className="w-full justify-start group"
            asChild
          >
            <a
              href={socialLinks.website}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Globe className="h-4 w-4 mr-3 group-hover:text-primary" />
              Website
              <ExternalLink className="h-3 w-3 ml-auto" />
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
