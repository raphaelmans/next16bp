import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface SetupStaleBannerProps {
  isFetching: boolean;
  onRefresh: () => void;
}

export function SetupStaleBanner({
  isFetching,
  onRefresh,
}: SetupStaleBannerProps) {
  return (
    <Card className="border-yellow-500/20 bg-yellow-50/50 dark:bg-yellow-950/20">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Showing last known setup status. Refresh to get latest updates.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isFetching}
          >
            {isFetching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
