import { makeCourtRepository } from "@/lib/modules/court/factories/court.factory";
import { makeOrganizationMemberService } from "@/lib/modules/organization-member/factories/organization-member.factory";
import { makePlaceRepository } from "@/lib/modules/place/factories/place.factory";
import { getContainer } from "@/lib/shared/infra/container";
import { CourtAddonRepository } from "../repositories/court-addon.repository";
import { CourtAddonService } from "../services/court-addon.service";

let courtAddonRepository: CourtAddonRepository | null = null;
let courtAddonService: CourtAddonService | null = null;

export function makeCourtAddonRepository(): CourtAddonRepository {
  if (!courtAddonRepository) {
    courtAddonRepository = new CourtAddonRepository(getContainer().db);
  }
  return courtAddonRepository;
}

export function makeCourtAddonService(): CourtAddonService {
  if (!courtAddonService) {
    courtAddonService = new CourtAddonService(
      makeCourtAddonRepository(),
      makeCourtRepository(),
      makePlaceRepository(),
      makeOrganizationMemberService(),
      getContainer().transactionManager,
    );
  }
  return courtAddonService;
}
