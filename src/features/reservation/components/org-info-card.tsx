"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface OrgInfoCardProps {
  organization: {
    id: string;
    name: string;
    logoUrl?: string;
    contactEmail?: string;
    contactPhone?: string;
  };
}

export function OrgInfoCard({ organization }: OrgInfoCardProps) {
  const initials = organization.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Court Owner</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Organization info */}
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            {organization.logoUrl ? (
              <AvatarImage src={organization.logoUrl} alt={organization.name} />
            ) : null}
            <AvatarFallback className="text-sm font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">
              {organization.name}
            </h3>
            <Link
              href={`/organizations/${organization.id}`}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              View profile
            </Link>
          </div>
        </div>

        {/* Contact info */}
        <div className="space-y-2">
          {organization.contactEmail && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a
                href={`mailto:${organization.contactEmail}`}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {organization.contactEmail}
              </a>
            </div>
          )}
          {organization.contactPhone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a
                href={`tel:${organization.contactPhone}`}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {organization.contactPhone}
              </a>
            </div>
          )}
        </div>

        {/* Contact button */}
        {organization.contactEmail && (
          <Button variant="outline" className="w-full" asChild>
            <a href={`mailto:${organization.contactEmail}`}>
              <Mail className="mr-2 h-4 w-4" />
              Contact Owner
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
