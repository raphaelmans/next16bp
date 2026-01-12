import type {
  ClaimRequestEventRecord,
  ClaimRequestRecord,
  OrganizationRecord,
  PlaceRecord,
} from "@/shared/infra/db/schema";
import { logger } from "@/shared/infra/logger";
import type { RequestContext } from "@/shared/kernel/context";
import type { TransactionManager } from "@/shared/kernel/transaction";
import {
  ClaimRequestNotFoundError,
  InvalidClaimStatusError,
} from "../errors/claim-request.errors";
import type {
  IClaimPlaceRepository,
  IClaimRequestRepository,
  IOrganizationRepository,
} from "../repositories/claim-request.repository";
import type { IClaimRequestEventRepository } from "../repositories/claim-request-event.repository";
import type { IApproveClaimRequestUseCase } from "../use-cases/approve-claim-request.use-case";

/**
 * Response type for claim request with full details (admin view)
 */
export interface ClaimRequestAdminDetails {
  claimRequest: ClaimRequestRecord;
  place: PlaceRecord;
  organization: OrganizationRecord;
  events: ClaimRequestEventRecord[];
}

export interface IClaimAdminService {
  getPendingClaimRequests(
    pagination: { limit: number; offset: number },
    ctx?: RequestContext,
  ): Promise<{ items: ClaimRequestRecord[]; total: number }>;
  getPendingCount(ctx?: RequestContext): Promise<number>;
  getClaimRequestById(
    requestId: string,
    ctx?: RequestContext,
  ): Promise<ClaimRequestAdminDetails>;
  approveClaimRequest(
    adminUserId: string,
    requestId: string,
    reviewNotes?: string,
  ): Promise<ClaimRequestRecord>;
  rejectClaimRequest(
    adminUserId: string,
    requestId: string,
    reason: string,
  ): Promise<ClaimRequestRecord>;
}

export class ClaimAdminService implements IClaimAdminService {
  constructor(
    private claimRequestRepository: IClaimRequestRepository,
    private claimRequestEventRepository: IClaimRequestEventRepository,
    private placeRepository: IClaimPlaceRepository,
    private organizationRepository: IOrganizationRepository,
    private approveClaimRequestUseCase: IApproveClaimRequestUseCase,
    private transactionManager: TransactionManager,
  ) {}

  async getPendingClaimRequests(
    pagination: { limit: number; offset: number },
    ctx?: RequestContext,
  ): Promise<{ items: ClaimRequestRecord[]; total: number }> {
    return this.claimRequestRepository.findPending(pagination, ctx);
  }

  /**
   * Get count of pending claim requests
   */
  async getPendingCount(ctx?: RequestContext): Promise<number> {
    const result = await this.claimRequestRepository.findPending(
      { limit: 0, offset: 0 },
      ctx,
    );
    return result.total;
  }

  async getClaimRequestById(
    requestId: string,
    ctx?: RequestContext,
  ): Promise<ClaimRequestAdminDetails> {
    const claimRequest = await this.claimRequestRepository.findById(
      requestId,
      ctx,
    );
    if (!claimRequest) {
      throw new ClaimRequestNotFoundError(requestId);
    }

    const place = await this.placeRepository.findById(
      claimRequest.placeId,
      ctx,
    );
    if (!place) {
      throw new ClaimRequestNotFoundError(requestId);
    }

    const organization = await this.organizationRepository.findById(
      claimRequest.organizationId,
      ctx,
    );
    if (!organization) {
      throw new ClaimRequestNotFoundError(requestId);
    }

    const events = await this.claimRequestEventRepository.findByClaimRequestId(
      requestId,
      ctx,
    );

    return {
      claimRequest,
      place,
      organization,
      events,
    };
  }

  async approveClaimRequest(
    adminUserId: string,
    requestId: string,
    reviewNotes?: string,
  ): Promise<ClaimRequestRecord> {
    return this.approveClaimRequestUseCase.execute(
      adminUserId,
      requestId,
      reviewNotes,
    );
  }

  async rejectClaimRequest(
    adminUserId: string,
    requestId: string,
    reason: string,
  ): Promise<ClaimRequestRecord> {
    return this.transactionManager.run(async (tx) => {
      const ctx = { tx };

      const claimRequest = await this.claimRequestRepository.findByIdForUpdate(
        requestId,
        ctx,
      );
      if (!claimRequest) {
        throw new ClaimRequestNotFoundError(requestId);
      }

      if (claimRequest.status !== "PENDING") {
        throw new InvalidClaimStatusError(
          `Cannot reject claim in ${claimRequest.status} status`,
        );
      }

      // Update claim request
      const updated = await this.claimRequestRepository.update(
        requestId,
        {
          status: "REJECTED",
          reviewerUserId: adminUserId,
          reviewedAt: new Date(),
          reviewNotes: reason,
        },
        ctx,
      );

      // Revert place status based on request type
      const revertStatus =
        claimRequest.requestType === "CLAIM" ? "UNCLAIMED" : "CLAIMED";
      await this.placeRepository.update(
        claimRequest.placeId,
        { claimStatus: revertStatus },
        ctx,
      );

      // Audit event
      await this.claimRequestEventRepository.create(
        {
          claimRequestId: requestId,
          fromStatus: "PENDING",
          toStatus: "REJECTED",
          triggeredByUserId: adminUserId,
          notes: reason,
        },
        ctx,
      );

      logger.info(
        {
          event: "claim_request.rejected",
          claimRequestId: requestId,
          adminUserId,
          reason,
        },
        "Claim request rejected",
      );

      return updated;
    });
  }
}
