import { makeOrganizationRepository } from "@/lib/modules/organization/factories/organization.factory";
import { getContainer } from "@/lib/shared/infra/container";
import { OrganizationPaymentMethodRepository } from "../repositories/organization-payment-method.repository";
import { OrganizationReservationPolicyRepository } from "../repositories/organization-reservation-policy.repository";
import { OrganizationPaymentService } from "../services/organization-payment.service";

let organizationPaymentMethodRepository: OrganizationPaymentMethodRepository | null =
  null;
let organizationReservationPolicyRepository: OrganizationReservationPolicyRepository | null =
  null;
let organizationPaymentService: OrganizationPaymentService | null = null;

export function makeOrganizationPaymentMethodRepository(): OrganizationPaymentMethodRepository {
  if (!organizationPaymentMethodRepository) {
    organizationPaymentMethodRepository =
      new OrganizationPaymentMethodRepository(getContainer().db);
  }
  return organizationPaymentMethodRepository;
}

export function makeOrganizationReservationPolicyRepository(): OrganizationReservationPolicyRepository {
  if (!organizationReservationPolicyRepository) {
    organizationReservationPolicyRepository =
      new OrganizationReservationPolicyRepository(getContainer().db);
  }
  return organizationReservationPolicyRepository;
}

export function makeOrganizationPaymentService(): OrganizationPaymentService {
  if (!organizationPaymentService) {
    organizationPaymentService = new OrganizationPaymentService(
      makeOrganizationRepository(),
      makeOrganizationPaymentMethodRepository(),
      getContainer().transactionManager,
    );
  }
  return organizationPaymentService;
}
