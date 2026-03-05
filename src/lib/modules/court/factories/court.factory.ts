import { makeCourtHoursRepository } from "@/lib/modules/court-hours/factories/court-hours.factory";
import { makeCourtRateRuleRepository } from "@/lib/modules/court-rate-rule/factories/court-rate-rule.factory";
import { makeOrganizationMemberService } from "@/lib/modules/organization-member/factories/organization-member.factory";
import { makeOrganizationRepository } from "@/lib/modules/organization/factories/organization.factory";
import { makePlaceRepository } from "@/lib/modules/place/factories/place.factory";
import { makePlaceVerificationRepository } from "@/lib/modules/place-verification/factories/place-verification.factory";
import { makeObjectStorageService } from "@/lib/modules/storage/factories/storage.factory";
import { getContainer } from "@/lib/shared/infra/container";
import { AdminCourtRepository } from "../repositories/admin-court.repository";
import { CourtRepository } from "../repositories/court.repository";
import { AdminCourtService } from "../services/admin-court.service";
import { CourtDiscoveryService } from "../services/court-discovery.service";
import { CourtManagementService } from "../services/court-management.service";

let courtRepository: CourtRepository | null = null;
let adminCourtRepository: AdminCourtRepository | null = null;
let courtDiscoveryService: CourtDiscoveryService | null = null;
let adminCourtService: AdminCourtService | null = null;
let courtManagementService: CourtManagementService | null = null;

export function makeCourtRepository(): CourtRepository {
  if (!courtRepository) {
    courtRepository = new CourtRepository(getContainer().db);
  }
  return courtRepository;
}

export function makeAdminCourtRepository(): AdminCourtRepository {
  if (!adminCourtRepository) {
    adminCourtRepository = new AdminCourtRepository(getContainer().db);
  }
  return adminCourtRepository;
}

export function makeCourtDiscoveryService(): CourtDiscoveryService {
  if (!courtDiscoveryService) {
    courtDiscoveryService = new CourtDiscoveryService(makeCourtRepository());
  }
  return courtDiscoveryService;
}

export function makeAdminCourtService(): AdminCourtService {
  if (!adminCourtService) {
    adminCourtService = new AdminCourtService(
      makeAdminCourtRepository(),
      getContainer().transactionManager,
      makeObjectStorageService(),
      makeOrganizationRepository(),
      makePlaceVerificationRepository(),
      makeCourtHoursRepository(),
      makeCourtRateRuleRepository(),
    );
  }
  return adminCourtService;
}

export function makeCourtManagementService(): CourtManagementService {
  if (!courtManagementService) {
    courtManagementService = new CourtManagementService(
      makeCourtRepository(),
      makePlaceRepository(),
      makeOrganizationMemberService(),
      getContainer().transactionManager,
    );
  }
  return courtManagementService;
}
