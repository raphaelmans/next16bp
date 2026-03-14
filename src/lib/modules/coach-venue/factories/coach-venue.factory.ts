import { makeCoachRepository } from "@/lib/modules/coach/factories/coach.factory";
import { makeOrganizationRepository } from "@/lib/modules/organization/factories/organization.factory";
import { makePlaceRepository } from "@/lib/modules/place/factories/place.factory";
import { getContainer } from "@/lib/shared/infra/container";
import { CoachVenueRepository } from "../repositories/coach-venue.repository";
import { CoachVenueService } from "../services/coach-venue.service";

let coachVenueRepository: CoachVenueRepository | null = null;
let coachVenueService: CoachVenueService | null = null;

export function makeCoachVenueRepository(): CoachVenueRepository {
  if (!coachVenueRepository) {
    coachVenueRepository = new CoachVenueRepository(getContainer().db);
  }
  return coachVenueRepository;
}

export function makeCoachVenueService(): CoachVenueService {
  if (!coachVenueService) {
    coachVenueService = new CoachVenueService(
      makeCoachVenueRepository(),
      makeCoachRepository(),
      makePlaceRepository(),
      makeOrganizationRepository(),
    );
  }
  return coachVenueService;
}
