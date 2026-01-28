import { makeClaimRequestRepository } from "@/modules/claim-request/factories/claim-request.factory";
import { makeCourtRepository } from "@/modules/court/factories/court.factory";
import { makeOrganizationRepository } from "@/modules/organization/factories/organization.factory";
import { makePlaceRepository } from "@/modules/place/factories/place.factory";
import { GetOwnerSetupStatusUseCase } from "../use-cases/get-owner-setup-status.use-case";

let ownerSetupStatusUseCase: GetOwnerSetupStatusUseCase | null = null;

export function makeOwnerSetupStatusUseCase() {
  if (!ownerSetupStatusUseCase) {
    ownerSetupStatusUseCase = new GetOwnerSetupStatusUseCase(
      makeOrganizationRepository(),
      makePlaceRepository(),
      makeClaimRequestRepository(),
      makeCourtRepository(),
    );
  }

  return ownerSetupStatusUseCase;
}
