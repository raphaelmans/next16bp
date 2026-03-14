import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CoachDetailAboutProps {
  bio?: string | null;
  coachingPhilosophy?: string | null;
  playingBackground?: string | null;
}

export function CoachDetailAbout({
  bio,
  coachingPhilosophy,
  playingBackground,
}: CoachDetailAboutProps) {
  const hasContent = bio || coachingPhilosophy || playingBackground;

  if (!hasContent) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>About</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {bio && (
          <div>
            <p className="whitespace-pre-line text-sm text-muted-foreground leading-relaxed">
              {bio}
            </p>
          </div>
        )}
        {coachingPhilosophy && (
          <div>
            <h3 className="mb-1.5 text-sm font-medium">Coaching Philosophy</h3>
            <p className="whitespace-pre-line text-sm text-muted-foreground leading-relaxed">
              {coachingPhilosophy}
            </p>
          </div>
        )}
        {playingBackground && (
          <div>
            <h3 className="mb-1.5 text-sm font-medium">Playing Background</h3>
            <p className="whitespace-pre-line text-sm text-muted-foreground leading-relaxed">
              {playingBackground}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
