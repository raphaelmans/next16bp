import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

interface SetupStaleBannerProps {
  isFetching: boolean;
  onRefresh: () => void;
}

export function SetupStaleBanner({
  isFetching,
  onRefresh,
}: SetupStaleBannerProps) {
  return (
    <Card className="border-warning/20 bg-warning-light">
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
            {isFetching && <Spinner className="mr-2" />}
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
