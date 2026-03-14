import { ConflictError } from "@/lib/shared/kernel/errors";

export class CoachHoursOverlapError extends ConflictError {
  readonly code = "COACH_HOURS_OVERLAP";

  constructor(coachId: string, dayOfWeek: number) {
    super("Coach hours windows cannot overlap", { coachId, dayOfWeek });
  }
}
