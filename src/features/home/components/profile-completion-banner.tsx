"use client";

import { AlertCircle, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { appRoutes } from "@/common/app-routes";
import { Button } from "@/components/ui/button";

interface ProfileCompletionBannerProps {
  isProfileComplete: boolean;
}

export function ProfileCompletionBanner({
  isProfileComplete,
}: ProfileCompletionBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check localStorage only on client
    const dismissed = localStorage.getItem("kudos.profile-banner-dismissed");
    if (!isProfileComplete && !dismissed) {
      setIsVisible(true);
    }
  }, [isProfileComplete]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("kudos.profile-banner-dismissed", "true");
  };

  if (!isVisible) return null;

  return (
    <div className="relative bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-start gap-4">
      <div className="p-2 bg-primary/20 rounded-full shrink-0">
        <AlertCircle className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1">
        <h4 className="font-medium text-primary">Complete your profile</h4>
        <p className="text-sm text-muted-foreground mt-1 mb-3">
          Add your phone number and other details to make booking courts faster
          and easier.
        </p>
        <Button
          size="sm"
          variant="outline"
          className="border-primary/20 hover:bg-primary/20 text-primary"
          asChild
        >
          <Link href={appRoutes.account.profile}>Complete Profile</Link>
        </Button>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-muted-foreground hover:text-foreground -mt-1 -mr-1"
        onClick={handleDismiss}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Dismiss</span>
      </Button>
    </div>
  );
}
