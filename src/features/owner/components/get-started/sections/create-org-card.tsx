import { ArrowRight, Building2, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface CreateOrgCardProps {
  hasOrganization: boolean;
  isLoading: boolean;
  organization?: { id: string; name: string };
  onCreateClick: () => void;
}

export function CreateOrgCard({
  hasOrganization,
  isLoading,
  organization,
  onCreateClick,
}: CreateOrgCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-muted animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-32 bg-muted rounded animate-pulse" />
              <div className="h-4 w-48 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hasOrganization) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-heading font-semibold">
                  Organization created
                </p>
                <Badge variant="outline" className="text-xs">
                  Complete
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {organization?.name}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="h-6 w-6" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-heading font-semibold">
                  Create organization
                </p>
                <Badge>Required</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Set up your club, sports center, or facility profile.
              </p>
            </div>
            <Button onClick={onCreateClick}>
              Create organization
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
