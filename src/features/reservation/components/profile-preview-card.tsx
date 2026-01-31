"use client";

import { AlertTriangle, Edit, Mail, Phone, User } from "lucide-react";
import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProfilePreviewCardProps {
  profile: {
    displayName?: string;
    email?: string;
    phone?: string;
    avatarUrl?: string;
  };
  isComplete: boolean;
  redirectTo?: string;
  className?: string;
}

export function ProfilePreviewCard({
  profile,
  isComplete,
  redirectTo,
  className,
}: ProfilePreviewCardProps) {
  const initials = profile.displayName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const editHref = redirectTo
    ? `${appRoutes.account.profile}?redirect=${encodeURIComponent(redirectTo)}`
    : appRoutes.account.profile;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Your Information</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href={editHref}>
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isComplete && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please complete your profile before booking. Your contact
              information will be shared with the court owner.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={profile.avatarUrl} alt={profile.displayName} />
            <AvatarFallback>
              {initials || <User className="h-5 w-5" />}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">
              {profile.displayName || "No name set"}
            </p>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {profile.email || "No email set"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {profile.phone || "No phone set"}
            </span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground pt-2 border-t">
          This information will be shared with the court owner for booking
          confirmation.
        </p>
      </CardContent>
    </Card>
  );
}
