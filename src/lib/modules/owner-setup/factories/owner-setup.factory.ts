import { makeClaimRequestRepository } from "@/lib/modules/claim-request/factories/claim-request.factory";
import { makeCourtRepository } from "@/lib/modules/court/factories/court.factory";
import { makeOrganizationRepository } from "@/lib/modules/organization/factories/organization.factory";
import { makePlaceRepository } from "@/lib/modules/place/factories/place.factory";
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
