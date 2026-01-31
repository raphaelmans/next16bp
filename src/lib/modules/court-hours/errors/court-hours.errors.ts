import { ValidationError } from "@/lib/shared/kernel/errors";

export class CourtHoursOverlapError extends ValidationError {
  readonly code = "COURT_HOURS_OVERLAP";

  constructor(courtId: string, dayOfWeek: number) {
    super("Court hours windows overlap", { courtId, dayOfWeek });
  }
}
