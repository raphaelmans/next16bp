import { eq } from "drizzle-orm";
import type { TransactionManager } from "@/shared/kernel/transaction";
import type { ClaimRequestRecord } from "@/shared/infra/db/schema";
import {
  curatedCourtDetail,
  reservableCourtDetail,
} from "@/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/shared/infra/db/types";
import type {
  IClaimRequestRepository,
  IClaimCourtRepository,
} from "../repositories/claim-request.repository";
import type { IClaimRequestEventRepository } from "../repositories/claim-request-event.repository";
import {
  ClaimRequestNotFoundError,
  InvalidClaimStatusError,
  CourtNotFoundError,
} from "../errors/claim-request.errors";
import { logger } from "@/shared/infra/logger";

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
    private courtRepository: IClaimCourtRepository,
    private claimRequestEventRepository: IClaimRequestEventRepository,
    private transactionManager: TransactionManager,
    private db: DbClient,
  ) {}

  async execute(
    adminUserId: string,
    requestId: string,
    reviewNotes?: string,
  ): Promise<ClaimRequestRecord> {
    return this.transactionManager.run(async (tx) => {
      const ctx = { tx };
      const txClient = tx as DrizzleTransaction;

      // 1. Lock claim request
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

      // 2. Lock court
      const court = await this.courtRepository.findByIdForUpdate(
        claimRequest.courtId,
        ctx,
      );
      if (!court) {
        throw new CourtNotFoundError(claimRequest.courtId);
      }

      // 3. Get curated detail (to potentially preserve data)
      const curatedDetailResult = await txClient
        .select()
        .from(curatedCourtDetail)
        .where(eq(curatedCourtDetail.courtId, court.id))
        .limit(1);
      const existingCuratedDetail = curatedDetailResult[0];

      // 4. Update claim request
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

      // 5. Update court - THIS IS THE KEY TRANSFORMATION
      await this.courtRepository.update(
        court.id,
        {
          claimStatus: "CLAIMED",
          courtType: "RESERVABLE",
          organizationId: claimRequest.organizationId,
        },
        ctx,
      );

      // 6. Create reservable court detail
      await txClient.insert(reservableCourtDetail).values({
        courtId: court.id,
        isFree: false,
        defaultCurrency: "PHP",
        // Could copy website from curated if desired
      });

      // 7. Delete curated court detail if exists
      if (existingCuratedDetail) {
        await txClient
          .delete(curatedCourtDetail)
          .where(eq(curatedCourtDetail.courtId, court.id));
      }

      // 8. Create audit event
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
          courtId: court.id,
          organizationId: claimRequest.organizationId,
          adminUserId,
        },
        "Claim request approved - court transformed to reservable",
      );

      return updatedRequest;
    });
  }
}
