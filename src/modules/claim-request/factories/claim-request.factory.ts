import { getContainer } from "@/shared/infra/container";
import {
  ClaimRequestRepository,
  OrganizationRepository,
  ClaimCourtRepository,
} from "../repositories/claim-request.repository";
import { ClaimRequestEventRepository } from "../repositories/claim-request-event.repository";
import { ClaimRequestService } from "../services/claim-request.service";
import { ClaimAdminService } from "../services/claim-admin.service";
import { ApproveClaimRequestUseCase } from "../use-cases/approve-claim-request.use-case";

let claimRequestRepository: ClaimRequestRepository | null = null;
let claimRequestEventRepository: ClaimRequestEventRepository | null = null;
let organizationRepository: OrganizationRepository | null = null;
let courtRepository: ClaimCourtRepository | null = null;
let claimRequestService: ClaimRequestService | null = null;
let claimAdminService: ClaimAdminService | null = null;
let approveClaimRequestUseCase: ApproveClaimRequestUseCase | null = null;

export function makeClaimRequestRepository() {
  if (!claimRequestRepository) {
    claimRequestRepository = new ClaimRequestRepository(getContainer().db);
  }
  return claimRequestRepository;
}

export function makeClaimRequestEventRepository() {
  if (!claimRequestEventRepository) {
    claimRequestEventRepository = new ClaimRequestEventRepository(
      getContainer().db,
    );
  }
  return claimRequestEventRepository;
}

export function makeOrganizationRepository() {
  if (!organizationRepository) {
    organizationRepository = new OrganizationRepository(getContainer().db);
  }
  return organizationRepository;
}

export function makeClaimCourtRepository() {
  if (!courtRepository) {
    courtRepository = new ClaimCourtRepository(getContainer().db);
  }
  return courtRepository;
}

export function makeClaimRequestService() {
  if (!claimRequestService) {
    claimRequestService = new ClaimRequestService(
      makeClaimRequestRepository(),
      makeClaimRequestEventRepository(),
      makeOrganizationRepository(),
      makeClaimCourtRepository(),
      getContainer().transactionManager,
    );
  }
  return claimRequestService;
}

export function makeApproveClaimRequestUseCase() {
  if (!approveClaimRequestUseCase) {
    approveClaimRequestUseCase = new ApproveClaimRequestUseCase(
      makeClaimRequestRepository(),
      makeClaimCourtRepository(),
      makeClaimRequestEventRepository(),
      getContainer().transactionManager,
      getContainer().db,
    );
  }
  return approveClaimRequestUseCase;
}

export function makeClaimAdminService() {
  if (!claimAdminService) {
    claimAdminService = new ClaimAdminService(
      makeClaimRequestRepository(),
      makeClaimRequestEventRepository(),
      makeClaimCourtRepository(),
      makeOrganizationRepository(),
      makeApproveClaimRequestUseCase(),
      getContainer().transactionManager,
    );
  }
  return claimAdminService;
}
