import { Award, GraduationCap, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SKILL_LEVEL_LABELS: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
  COMPETITIVE: "Competitive",
};

const AGE_GROUP_LABELS: Record<string, string> = {
  KIDS: "Kids",
  TEENS: "Teens",
  ADULTS: "Adults",
  SENIORS: "Seniors",
};

interface CoachDetailQualificationsProps {
  certifications: {
    name: string;
    issuingBody?: string | null;
    level?: string | null;
  }[];
  yearsOfExperience?: number | null;
  skillLevels: { level: string }[];
  ageGroups: { ageGroup: string }[];
}

export function CoachDetailQualifications({
  certifications,
  yearsOfExperience,
  skillLevels,
  ageGroups,
}: CoachDetailQualificationsProps) {
  const hasContent =
    certifications.length > 0 ||
    yearsOfExperience != null ||
    skillLevels.length > 0 ||
    ageGroups.length > 0;

  if (!hasContent) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Qualifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {yearsOfExperience != null && (
          <div className="flex items-center gap-3 text-sm">
            <Award className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span>
              {yearsOfExperience} year{yearsOfExperience === 1 ? "" : "s"} of
              coaching experience
            </span>
          </div>
        )}

        {certifications.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              Certifications
            </div>
            <ul className="space-y-2 pl-6">
              {certifications.map((cert) => (
                <li key={cert.name} className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {cert.name}
                  </span>
                  {cert.issuingBody && <span> — {cert.issuingBody}</span>}
                  {cert.level && (
                    <span className="ml-1 text-xs">({cert.level})</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {skillLevels.length > 0 && (
          <div>
            <div className="mb-2 text-sm font-medium">Skill Levels Coached</div>
            <div className="flex flex-wrap gap-2">
              {skillLevels.map((sl) => (
                <Badge key={sl.level} variant="outline">
                  {SKILL_LEVEL_LABELS[sl.level] ?? sl.level}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {ageGroups.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4 text-muted-foreground" />
              Age Groups
            </div>
            <div className="flex flex-wrap gap-2">
              {ageGroups.map((ag) => (
                <Badge key={ag.ageGroup} variant="outline">
                  {AGE_GROUP_LABELS[ag.ageGroup] ?? ag.ageGroup}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
