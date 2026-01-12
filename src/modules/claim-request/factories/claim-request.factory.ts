import { getContainer } from "@/shared/infra/container";
import {
  ClaimPlaceRepository,
  ClaimRequestRepository,
  OrganizationRepository,
} from "../repositories/claim-request.repository";
import { ClaimRequestEventRepository } from "../repositories/claim-request-event.repository";
import { ClaimAdminService } from "../services/claim-admin.service";
import { ClaimRequestService } from "../services/claim-request.service";
import { ApproveClaimRequestUseCase } from "../use-cases/approve-claim-request.use-case";

let claimRequestRepository: ClaimRequestRepository | null = null;
let claimRequestEventRepository: ClaimRequestEventRepository | null = null;
let organizationRepository: OrganizationRepository | null = null;
let placeRepository: ClaimPlaceRepository | null = null;
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

export function makeClaimPlaceRepository() {
  if (!placeRepository) {
    placeRepository = new ClaimPlaceRepository(getContainer().db);
  }
  return placeRepository;
}

export function makeClaimRequestService() {
  if (!claimRequestService) {
    claimRequestService = new ClaimRequestService(
      makeClaimRequestRepository(),
      makeClaimRequestEventRepository(),
      makeOrganizationRepository(),
      makeClaimPlaceRepository(),
      getContainer().transactionManager,
    );
  }
  return claimRequestService;
}

export function makeApproveClaimRequestUseCase() {
  if (!approveClaimRequestUseCase) {
    approveClaimRequestUseCase = new ApproveClaimRequestUseCase(
      makeClaimRequestRepository(),
      makeClaimPlaceRepository(),
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
      makeClaimPlaceRepository(),
      makeOrganizationRepository(),
      makeApproveClaimRequestUseCase(),
      getContainer().transactionManager,
    );
  }
  return claimAdminService;
}
