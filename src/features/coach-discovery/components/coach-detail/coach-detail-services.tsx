import { Clock, Globe, MapPinned } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SESSION_TYPE_LABELS: Record<string, string> = {
  PRIVATE: "Private",
  SEMI_PRIVATE: "Semi-private",
  GROUP: "Group",
};

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining > 0 ? `${hours}h ${remaining}min` : `${hours}h`;
};

interface CoachDetailServicesProps {
  sessionTypes: { sessionType: string }[];
  sessionDurations: { durationMinutes: number }[];
  willingToTravel: boolean;
  onlineCoaching: boolean;
}

export function CoachDetailServices({
  sessionTypes,
  sessionDurations,
  willingToTravel,
  onlineCoaching,
}: CoachDetailServicesProps) {
  const hasContent =
    sessionTypes.length > 0 ||
    sessionDurations.length > 0 ||
    willingToTravel ||
    onlineCoaching;

  if (!hasContent) {
    return null;
  }

  const sortedDurations = [...sessionDurations].sort(
    (a, b) => a.durationMinutes - b.durationMinutes,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Services</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {sessionTypes.length > 0 && (
          <div>
            <div className="mb-2 text-sm font-medium">Session Types</div>
            <div className="flex flex-wrap gap-2">
              {sessionTypes.map((st) => (
                <Badge key={st.sessionType} variant="secondary">
                  {SESSION_TYPE_LABELS[st.sessionType] ?? st.sessionType}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {sortedDurations.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Available Durations
            </div>
            <div className="flex flex-wrap gap-2">
              {sortedDurations.map((d) => (
                <Badge key={d.durationMinutes} variant="outline">
                  {formatDuration(d.durationMinutes)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {(willingToTravel || onlineCoaching) && (
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {willingToTravel && (
              <span className="inline-flex items-center gap-1.5">
                <MapPinned className="h-4 w-4" />
                Willing to travel
              </span>
            )}
            {onlineCoaching && (
              <span className="inline-flex items-center gap-1.5">
                <Globe className="h-4 w-4" />
                Online coaching available
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
