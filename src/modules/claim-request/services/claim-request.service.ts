import type {
  ClaimRequestEventRecord,
  ClaimRequestRecord,
  PlaceRecord,
} from "@/shared/infra/db/schema";
import { logger } from "@/shared/infra/logger";
import type { RequestContext } from "@/shared/kernel/context";
import type { TransactionManager } from "@/shared/kernel/transaction";
import type { SubmitClaimRequestDTO, SubmitRemovalRequestDTO } from "../dtos";
import {
  ClaimRequestNotFoundError,
  InvalidClaimStatusError,
  NotClaimRequestOwnerError,
  NotCuratedPlaceError,
  NotOrganizationOwnerError,
  OrganizationNotFoundError,
  PendingClaimExistsError,
  PlaceNotFoundError,
  PlaceNotUnclaimedError,
} from "../errors/claim-request.errors";
import type {
  IClaimPlaceRepository,
  IClaimRequestRepository,
  IOrganizationRepository,
} from "../repositories/claim-request.repository";
import type { IClaimRequestEventRepository } from "../repositories/claim-request-event.repository";

export interface ClaimRequestWithPlace {
  claimRequest: ClaimRequestRecord;
  place: PlaceRecord;
}

export interface ClaimRequestWithDetails extends ClaimRequestWithPlace {
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
    private placeRepository: IClaimPlaceRepository,
    private transactionManager: TransactionManager,
  ) {}

  async submitClaimRequest(
    userId: string,
    data: SubmitClaimRequestDTO,
    _ctx?: RequestContext,
  ): Promise<ClaimRequestRecord> {
    return this.transactionManager.run(async (tx) => {
      const txCtx = { tx };

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

      const place = await this.placeRepository.findByIdForUpdate(
        data.placeId,
        txCtx,
      );
      if (!place) {
        throw new PlaceNotFoundError(data.placeId);
      }

      if (place.placeType !== "CURATED") {
        throw new NotCuratedPlaceError(data.placeId);
      }

      if (place.claimStatus !== "UNCLAIMED") {
        throw new PlaceNotUnclaimedError(data.placeId);
      }

      const pending = await this.claimRequestRepository.findPendingByPlaceId(
        data.placeId,
        txCtx,
      );
      if (pending) {
        throw new PendingClaimExistsError(data.placeId);
      }

      const claimRequest = await this.claimRequestRepository.create(
        {
          placeId: data.placeId,
          organizationId: data.organizationId,
          requestType: "CLAIM",
          status: "PENDING",
          requestedByUserId: userId,
          requestNotes: data.requestNotes,
        },
        txCtx,
      );

      await this.placeRepository.update(
        data.placeId,
        { claimStatus: "CLAIM_PENDING" },
        txCtx,
      );

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
          placeId: data.placeId,
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

      const place = await this.placeRepository.findByIdForUpdate(
        data.placeId,
        txCtx,
      );
      if (!place) {
        throw new PlaceNotFoundError(data.placeId);
      }

      if (place.organizationId !== data.organizationId) {
        throw new NotOrganizationOwnerError();
      }

      const pending = await this.claimRequestRepository.findPendingByPlaceId(
        data.placeId,
        txCtx,
      );
      if (pending) {
        throw new PendingClaimExistsError(data.placeId);
      }

      const claimRequest = await this.claimRequestRepository.create(
        {
          placeId: data.placeId,
          organizationId: data.organizationId,
          requestType: "REMOVAL",
          status: "PENDING",
          requestedByUserId: userId,
          requestNotes: data.requestNotes,
        },
        txCtx,
      );

      await this.placeRepository.update(
        data.placeId,
        { claimStatus: "REMOVAL_REQUESTED" },
        txCtx,
      );

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
          placeId: data.placeId,
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

      if (request.requestedByUserId !== userId) {
        throw new NotClaimRequestOwnerError();
      }

      if (request.status !== "PENDING") {
        throw new InvalidClaimStatusError(
          `Cannot cancel claim request in ${request.status} status`,
        );
      }

      const updated = await this.claimRequestRepository.update(
        requestId,
        {
          status: "REJECTED",
          reviewNotes: "Cancelled by requester",
        },
        txCtx,
      );

      const revertStatus =
        request.requestType === "CLAIM" ? "UNCLAIMED" : "CLAIMED";
      await this.placeRepository.update(
        request.placeId,
        { claimStatus: revertStatus },
        txCtx,
      );

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

    if (claimRequest.requestedByUserId !== userId) {
      throw new NotClaimRequestOwnerError();
    }

    const place = await this.placeRepository.findById(
      claimRequest.placeId,
      ctx,
    );
    if (!place) {
      throw new PlaceNotFoundError(claimRequest.placeId);
    }

    const events = await this.claimRequestEventRepository.findByClaimRequestId(
      requestId,
      ctx,
    );

    return {
      claimRequest,
      place,
      events,
    };
  }
}
