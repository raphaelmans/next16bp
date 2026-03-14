import { makeCoachRepository } from "@/lib/modules/coach/factories/coach.factory";
import { getContainer } from "@/lib/shared/infra/container";
import { CoachHoursRepository } from "../repositories/coach-hours.repository";
import { CoachHoursService } from "../services/coach-hours.service";

let coachHoursRepository: CoachHoursRepository | null = null;
let coachHoursService: CoachHoursService | null = null;

export function makeCoachHoursRepository(): CoachHoursRepository {
  if (!coachHoursRepository) {
    coachHoursRepository = new CoachHoursRepository(getContainer().db);
  }
  return coachHoursRepository;
}

export function makeCoachHoursService(): CoachHoursService {
  if (!coachHoursService) {
    coachHoursService = new CoachHoursService(
      makeCoachHoursRepository(),
      makeCoachRepository(),
      getContainer().transactionManager,
    );
  }
  return coachHoursService;
}
