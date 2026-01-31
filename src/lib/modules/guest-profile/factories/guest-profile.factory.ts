import { makeOrganizationRepository } from "@/lib/modules/organization/factories/organization.factory";
import { getContainer } from "@/lib/shared/infra/container";
import { GuestProfileRepository } from "../repositories/guest-profile.repository";
import { GuestProfileService } from "../services/guest-profile.service";

let guestProfileRepository: GuestProfileRepository | null = null;
let guestProfileService: GuestProfileService | null = null;

export function makeGuestProfileRepository(): GuestProfileRepository {
  if (!guestProfileRepository) {
    guestProfileRepository = new GuestProfileRepository(getContainer().db);
  }
  return guestProfileRepository;
}

export function makeGuestProfileService(): GuestProfileService {
  if (!guestProfileService) {
    guestProfileService = new GuestProfileService(
      makeGuestProfileRepository(),
      makeOrganizationRepository(),
    );
  }
  return guestProfileService;
}
