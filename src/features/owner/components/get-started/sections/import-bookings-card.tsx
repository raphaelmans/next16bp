import { ArrowRight, FileSpreadsheet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ImportBookingsCardProps {
  hasVenue: boolean;
  onImportClick: () => void;
}

export function ImportBookingsCard({
  hasVenue,
  onImportClick,
}: ImportBookingsCardProps) {
  return (
    <Card className={!hasVenue ? "opacity-60" : ""}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-heading font-semibold">Import bookings</p>
                <Badge variant="secondary">Optional</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Import existing bookings from ICS, CSV, or XLSX files to block
                availability. Bookings are only committed after review.
              </p>
            </div>
            <Button
              onClick={onImportClick}
              disabled={!hasVenue}
              variant="outline"
            >
              Start import
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
