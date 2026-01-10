import type {
  ClaimRequestEventRecord,
  ClaimRequestRecord,
  CourtRecord,
} from "@/shared/infra/db/schema";
import { logger } from "@/shared/infra/logger";
import type { RequestContext } from "@/shared/kernel/context";
import type { TransactionManager } from "@/shared/kernel/transaction";
import type { SubmitClaimRequestDTO, SubmitRemovalRequestDTO } from "../dtos";
import {
  ClaimRequestNotFoundError,
  CourtNotFoundError,
  CourtNotUnclaimedError,
  InvalidClaimStatusError,
  NotClaimRequestOwnerError,
  NotCuratedCourtError,
  NotOrganizationOwnerError,
  OrganizationNotFoundError,
  PendingClaimExistsError,
} from "../errors/claim-request.errors";
import type {
  IClaimCourtRepository,
  IClaimRequestRepository,
  IOrganizationRepository,
} from "../repositories/claim-request.repository";
import type { IClaimRequestEventRepository } from "../repositories/claim-request-event.repository";

/**
 * Response type for claim request with court details
 */
export interface ClaimRequestWithCourt {
  claimRequest: ClaimRequestRecord;
  court: CourtRecord;
}

/**
 * Response type for claim request with all details
 */
export interface ClaimRequestWithDetails extends ClaimRequestWithCourt {
  events: ClaimRequestEventRecord[];
}

export interface IClaimRequestService {
  submitClaimRequest(
    userId: string,
    data: SubmitClaimRequestDTO,
    ctx?: RequestContext,
  ): Promise<ClaimRequestRecord>;
  submitRemovalRequest(
    userId: string,
    data: SubmitRemovalRequestDTO,
    ctx?: RequestContext,
  ): Promise<ClaimRequestRecord>;
  cancelRequest(
    userId: string,
    requestId: string,
    ctx?: RequestContext,
  ): Promise<ClaimRequestRecord>;
  getMyClaimRequests(
    userId: string,
    ctx?: RequestContext,
  ): Promise<ClaimRequestRecord[]>;
  getClaimRequestById(
    userId: string,
    requestId: string,
    ctx?: RequestContext,
  ): Promise<ClaimRequestWithDetails>;
}

export class ClaimRequestService implements IClaimRequestService {
  constructor(
    private claimRequestRepository: IClaimRequestRepository,
    private claimRequestEventRepository: IClaimRequestEventRepository,
    private organizationRepository: IOrganizationRepository,
    private courtRepository: IClaimCourtRepository,
    private transactionManager: TransactionManager,
  ) {}

  async submitClaimRequest(
    userId: string,
    data: SubmitClaimRequestDTO,
    _ctx?: RequestContext,
  ): Promise<ClaimRequestRecord> {
    return this.transactionManager.run(async (tx) => {
      const txCtx = { tx };

      // 1. Verify user owns the organization
      const org = await this.organizationRepository.findById(
        data.organizationId,
        txCtx,
      );
      if (!org) {
        throw new OrganizationNotFoundError(data.organizationId);
      }
      if (org.ownerUserId !== userId) {
        throw new NotOrganizationOwnerError();
      }

      // 2. Get court with lock
      const court = await this.courtRepository.findByIdForUpdate(
        data.courtId,
        txCtx,
      );
      if (!court) {
        throw new CourtNotFoundError(data.courtId);
      }

      // 3. Verify court is curated
      if (court.courtType !== "CURATED") {
        throw new NotCuratedCourtError(data.courtId);
      }

      // 4. Verify court is unclaimed
      if (court.claimStatus !== "UNCLAIMED") {
        throw new CourtNotUnclaimedError(data.courtId);
      }

      // 5. Check for existing pending claim
      const pending = await this.claimRequestRepository.findPendingByCourtId(
        data.courtId,
        txCtx,
      );
      if (pending) {
        throw new PendingClaimExistsError(data.courtId);
      }

      // 6. Create claim request
      const claimRequest = await this.claimRequestRepository.create(
        {
          courtId: data.courtId,
          organizationId: data.organizationId,
          requestType: "CLAIM",
          status: "PENDING",
          requestedByUserId: userId,
          requestNotes: data.requestNotes,
        },
        txCtx,
      );

      // 7. Update court claim status
      await this.courtRepository.update(
        data.courtId,
        { claimStatus: "CLAIM_PENDING" },
        txCtx,
      );

      // 8. Create audit event
      await this.claimRequestEventRepository.create(
        {
          claimRequestId: claimRequest.id,
          fromStatus: null,
          toStatus: "PENDING",
          triggeredByUserId: userId,
        },
        txCtx,
      );

      logger.info(
        {
          event: "claim_request.submitted",
          claimRequestId: claimRequest.id,
          courtId: data.courtId,
          organizationId: data.organizationId,
          userId,
        },
        "Claim request submitted",
      );

      return claimRequest;
    });
  }

  async submitRemovalRequest(
    userId: string,
    data: SubmitRemovalRequestDTO,
    _ctx?: RequestContext,
  ): Promise<ClaimRequestRecord> {
    return this.transactionManager.run(async (tx) => {
      const txCtx = { tx };

      // 1. Verify user owns the organization
      const org = await this.organizationRepository.findById(
        data.organizationId,
        txCtx,
      );
      if (!org) {
        throw new OrganizationNotFoundError(data.organizationId);
      }
      if (org.ownerUserId !== userId) {
        throw new NotOrganizationOwnerError();
      }

      // 2. Get court with lock
      const court = await this.courtRepository.findByIdForUpdate(
        data.courtId,
        txCtx,
      );
      if (!court) {
        throw new CourtNotFoundError(data.courtId);
      }

      // 3. Verify court belongs to the organization
      if (court.organizationId !== data.organizationId) {
        throw new NotOrganizationOwnerError();
      }

      // 4. Check for existing pending claim
      const pending = await this.claimRequestRepository.findPendingByCourtId(
        data.courtId,
        txCtx,
      );
      if (pending) {
        throw new PendingClaimExistsError(data.courtId);
      }

      // 5. Create removal request
      const claimRequest = await this.claimRequestRepository.create(
        {
          courtId: data.courtId,
          organizationId: data.organizationId,
          requestType: "REMOVAL",
          status: "PENDING",
          requestedByUserId: userId,
          requestNotes: data.requestNotes,
        },
        txCtx,
      );

      // 6. Update court claim status
      await this.courtRepository.update(
        data.courtId,
        { claimStatus: "REMOVAL_REQUESTED" },
        txCtx,
      );

      // 7. Create audit event
      await this.claimRequestEventRepository.create(
        {
          claimRequestId: claimRequest.id,
          fromStatus: null,
          toStatus: "PENDING",
          triggeredByUserId: userId,
        },
        txCtx,
      );

      logger.info(
        {
          event: "removal_request.submitted",
          claimRequestId: claimRequest.id,
          courtId: data.courtId,
          organizationId: data.organizationId,
          userId,
        },
        "Removal request submitted",
      );

      return claimRequest;
    });
  }

  async cancelRequest(
    userId: string,
    requestId: string,
    _ctx?: RequestContext,
  ): Promise<ClaimRequestRecord> {
    return this.transactionManager.run(async (tx) => {
      const txCtx = { tx };

      const request = await this.claimRequestRepository.findByIdForUpdate(
        requestId,
        txCtx,
      );
      if (!request) {
        throw new ClaimRequestNotFoundError(requestId);
      }

      // Only requester can cancel
      if (request.requestedByUserId !== userId) {
        throw new NotClaimRequestOwnerError();
      }

      // Can only cancel PENDING
      if (request.status !== "PENDING") {
        throw new InvalidClaimStatusError(
          `Cannot cancel claim request in ${request.status} status`,
        );
      }

      // Update request (treat as rejected by self)
      const updated = await this.claimRequestRepository.update(
        requestId,
        {
          status: "REJECTED",
          reviewNotes: "Cancelled by requester",
        },
        txCtx,
      );

      // Revert court status based on request type
      const revertStatus =
        request.requestType === "CLAIM" ? "UNCLAIMED" : "CLAIMED";
      await this.courtRepository.update(
        request.courtId,
        { claimStatus: revertStatus },
        txCtx,
      );

      // Audit event
      await this.claimRequestEventRepository.create(
        {
          claimRequestId: requestId,
          fromStatus: "PENDING",
          toStatus: "REJECTED",
          triggeredByUserId: userId,
          notes: "Cancelled by requester",
        },
        txCtx,
      );

      logger.info(
        {
          event: "claim_request.cancelled",
          claimRequestId: requestId,
          userId,
        },
        "Claim request cancelled",
      );

      return updated;
    });
  }

  async getMyClaimRequests(
    userId: string,
    ctx?: RequestContext,
  ): Promise<ClaimRequestRecord[]> {
    return this.claimRequestRepository.findByRequestedByUserId(userId, ctx);
  }

  async getClaimRequestById(
    userId: string,
    requestId: string,
    ctx?: RequestContext,
  ): Promise<ClaimRequestWithDetails> {
    const claimRequest = await this.claimRequestRepository.findById(
      requestId,
      ctx,
    );
    if (!claimRequest) {
      throw new ClaimRequestNotFoundError(requestId);
    }

    // Verify user has access (must be the requester)
    if (claimRequest.requestedByUserId !== userId) {
      throw new NotClaimRequestOwnerError();
    }

    const court = await this.courtRepository.findById(
      claimRequest.courtId,
      ctx,
    );
    if (!court) {
      throw new CourtNotFoundError(claimRequest.courtId);
    }

    const events = await this.claimRequestEventRepository.findByClaimRequestId(
      requestId,
      ctx,
    );

    return {
      claimRequest,
      court,
      events,
    };
  }
}
