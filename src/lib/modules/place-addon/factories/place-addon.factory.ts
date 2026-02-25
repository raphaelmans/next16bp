import { makeOrganizationRepository } from "@/lib/modules/organization/factories/organization.factory";
import { makePlaceRepository } from "@/lib/modules/place/factories/place.factory";
import { getContainer } from "@/lib/shared/infra/container";
import { PlaceAddonRepository } from "../repositories/place-addon.repository";
import { PlaceAddonService } from "../services/place-addon.service";

let placeAddonRepository: PlaceAddonRepository | null = null;
let placeAddonService: PlaceAddonService | null = null;

export function makePlaceAddonRepository(): PlaceAddonRepository {
  if (!placeAddonRepository) {
    placeAddonRepository = new PlaceAddonRepository(getContainer().db);
  }
  return placeAddonRepository;
}

export function makePlaceAddonService(): PlaceAddonService {
  if (!placeAddonService) {
    placeAddonService = new PlaceAddonService(
      makePlaceAddonRepository(),
      makePlaceRepository(),
      makeOrganizationRepository(),
      getContainer().transactionManager,
    );
  }
  return placeAddonService;
}
