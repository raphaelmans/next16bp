import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StepPlaceholder({
  eyebrow,
  title,
  description,
  bullets,
  isComplete,
}: {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  isComplete: boolean;
}) {
  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {eyebrow}
            </p>
            <CardTitle className="font-heading text-2xl">{title}</CardTitle>
          </div>
          <Badge variant={isComplete ? "success" : "outline"}>
            {isComplete ? "Complete" : "Pending"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        <ul className="space-y-2 text-sm text-foreground">
          {bullets.map((bullet) => (
            <li key={bullet} className="rounded-lg bg-muted/50 px-3 py-2">
              {bullet}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
