import { eq } from "drizzle-orm";
import type { ClaimRequestRecord } from "@/shared/infra/db/schema";
import {
  curatedPlaceDetail,
  reservablePlacePolicy,
} from "@/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/shared/infra/db/types";
import { logger } from "@/shared/infra/logger";
import type { TransactionManager } from "@/shared/kernel/transaction";
import {
  ClaimRequestNotFoundError,
  InvalidClaimStatusError,
  PlaceNotFoundError,
} from "../errors/claim-request.errors";
import type {
  IClaimPlaceRepository,
  IClaimRequestRepository,
} from "../repositories/claim-request.repository";
import type { IClaimRequestEventRepository } from "../repositories/claim-request-event.repository";

export interface IApproveClaimRequestUseCase {
  execute(
    adminUserId: string,
    requestId: string,
    reviewNotes?: string,
  ): Promise<ClaimRequestRecord>;
}

export class ApproveClaimRequestUseCase implements IApproveClaimRequestUseCase {
  constructor(
    private claimRequestRepository: IClaimRequestRepository,
    private placeRepository: IClaimPlaceRepository,
    private claimRequestEventRepository: IClaimRequestEventRepository,
    private transactionManager: TransactionManager,
    _db: DbClient,
  ) {}

  async execute(
    adminUserId: string,
    requestId: string,
    reviewNotes?: string,
  ): Promise<ClaimRequestRecord> {
    return this.transactionManager.run(async (tx) => {
      const ctx = { tx };
      const txClient = tx as DrizzleTransaction;

      const claimRequest = await this.claimRequestRepository.findByIdForUpdate(
        requestId,
        ctx,
      );
      if (!claimRequest) {
        throw new ClaimRequestNotFoundError(requestId);
      }

      if (claimRequest.status !== "PENDING") {
        throw new InvalidClaimStatusError(
          `Cannot approve claim in ${claimRequest.status} status`,
        );
      }

      const place = await this.placeRepository.findByIdForUpdate(
        claimRequest.placeId,
        ctx,
      );
      if (!place) {
        throw new PlaceNotFoundError(claimRequest.placeId);
      }

      const updatedRequest = await this.claimRequestRepository.update(
        requestId,
        {
          status: "APPROVED",
          reviewerUserId: adminUserId,
          reviewedAt: new Date(),
          reviewNotes,
        },
        ctx,
      );

      await this.placeRepository.update(
        place.id,
        {
          claimStatus: "CLAIMED",
          placeType: "RESERVABLE",
          organizationId: claimRequest.organizationId,
        },
        ctx,
      );

      await txClient
        .insert(reservablePlacePolicy)
        .values({ placeId: place.id })
        .onConflictDoNothing();

      await txClient
        .delete(curatedPlaceDetail)
        .where(eq(curatedPlaceDetail.placeId, place.id));

      await this.claimRequestEventRepository.create(
        {
          claimRequestId: requestId,
          fromStatus: "PENDING",
          toStatus: "APPROVED",
          triggeredByUserId: adminUserId,
          notes: reviewNotes,
        },
        ctx,
      );

      logger.info(
        {
          event: "claim_request.approved",
          claimRequestId: requestId,
          placeId: place.id,
          organizationId: claimRequest.organizationId,
          adminUserId,
        },
        "Claim request approved - place transformed to reservable",
      );

      return updatedRequest;
    });
  }
}
