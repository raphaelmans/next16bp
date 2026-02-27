import { AlertCircle, Loader2 } from "lucide-react";
import { getClientErrorMessage } from "@/common/toast/errors";
import { Container } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface SetupErrorBannerProps {
  error: unknown;
  isFetching: boolean;
  onRetry: () => void;
}

export function SetupErrorBanner({
  error,
  isFetching,
  onRetry,
}: SetupErrorBannerProps) {
  return (
    <div className="py-8">
      <Container size="xl">
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-2">
                <p className="font-heading font-semibold">
                  Unable to load setup
                </p>
                <p className="text-sm text-muted-foreground">
                  {getClientErrorMessage(
                    error,
                    "Please try again in a moment.",
                  )}
                </p>
                <Button
                  variant="outline"
                  onClick={onRetry}
                  disabled={isFetching}
                >
                  {isFetching && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Retry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </Container>
    </div>
  );
}
