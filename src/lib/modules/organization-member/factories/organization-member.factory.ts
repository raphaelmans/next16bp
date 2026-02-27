import { makeOrganizationRepository } from "@/lib/modules/organization/factories/organization.factory";
import { getContainer } from "@/lib/shared/infra/container";
import { makeEmailService } from "@/lib/shared/infra/email/email.factory";
import { OrganizationMemberRepository } from "../repositories/organization-member.repository";
import { OrganizationMemberService } from "../services/organization-member.service";

let organizationMemberRepository: OrganizationMemberRepository | null = null;
let organizationMemberService: OrganizationMemberService | null = null;

export function makeOrganizationMemberRepository(): OrganizationMemberRepository {
  if (!organizationMemberRepository) {
    organizationMemberRepository = new OrganizationMemberRepository(
      getContainer().db,
    );
  }

  return organizationMemberRepository;
}

export function makeOrganizationMemberService(): OrganizationMemberService {
  if (!organizationMemberService) {
    organizationMemberService = new OrganizationMemberService(
      makeOrganizationMemberRepository(),
      makeOrganizationRepository(),
      makeEmailService(),
      getContainer().transactionManager,
    );
  }

  return organizationMemberService;
}
