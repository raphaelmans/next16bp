import { makeClaimRequestRepository } from "@/lib/modules/claim-request/factories/claim-request.factory";
import { makeCourtRepository } from "@/lib/modules/court/factories/court.factory";
import { makeCourtHoursRepository } from "@/lib/modules/court-hours/factories/court-hours.factory";
import { makeCourtRateRuleRepository } from "@/lib/modules/court-rate-rule/factories/court-rate-rule.factory";
import { makeOrganizationRepository } from "@/lib/modules/organization/factories/organization.factory";
import { makeOrganizationPaymentMethodRepository } from "@/lib/modules/organization-payment/factories/organization-payment.factory";
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
      makeCourtHoursRepository(),
      makeCourtRateRuleRepository(),
      makeOrganizationPaymentMethodRepository(),
    );
  }

  return ownerSetupStatusUseCase;
}
