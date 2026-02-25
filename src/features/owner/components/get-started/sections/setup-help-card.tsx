import { HelpCircle } from "lucide-react";
import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function SetupHelpCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <HelpCircle className="h-4 w-4" />
          Help
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <p className="font-medium">What is verification?</p>
          <p className="text-muted-foreground">
            Upload proof of ownership to get a verified badge and unlock online
            reservations.
          </p>
        </div>
        <Separator />
        <div>
          <p className="font-medium">Import limitations</p>
          <p className="text-muted-foreground">
            Import supports ICS, CSV, and XLSX files. Screenshots are not
            currently supported.
          </p>
        </div>
        <Separator />
        <div>
          <p className="font-medium">Need help?</p>
          <Link
            href={appRoutes.contactUs.base}
            className="text-primary hover:underline"
          >
            Contact support
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
