"use client";

import { Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PlaceDetailNextStepsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>What happens next?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <span>We&apos;ll hold the requested slots while you review.</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <span>Owners review and confirm paid reservations.</span>
        </div>
      </CardContent>
    </Card>
  );
}
