import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CompleteStep({ isReady }: { isReady: boolean }) {
  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Final step
            </p>
            <CardTitle className="font-heading text-2xl">
              {isReady
                ? "Coach setup is ready"
                : "More setup is still required"}
            </CardTitle>
          </div>
          <Badge variant={isReady ? "success" : "outline"}>
            {isReady ? "Launch-ready" : "In progress"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <p className="text-sm leading-6 text-muted-foreground">
          {isReady
            ? "This foundation confirms the setup contract is satisfied. Dashboard, booking, and management screens arrive in later coach tasks."
            : "Finish the earlier steps first. This shell will move here automatically once the required coach setup data is present."}
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href={appRoutes.coach.getStarted}>Review setup</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
