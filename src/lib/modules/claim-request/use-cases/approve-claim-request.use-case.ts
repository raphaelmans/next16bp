import type { NotificationDeliveryService } from "@/lib/modules/notification-delivery/services/notification-delivery.service";
import type { IPlaceVerificationRepository } from "@/lib/modules/place-verification/repositories/place-verification.repository";
import type { ClaimRequestRecord } from "@/lib/shared/infra/db/schema";
import { logger } from "@/lib/shared/infra/logger";
import type { TransactionManager } from "@/lib/shared/kernel/transaction";
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
    private placeVerificationRepository: IPlaceVerificationRepository,
    private claimRequestEventRepository: IClaimRequestEventRepository,
    private transactionManager: TransactionManager,
    private notificationDeliveryService: NotificationDeliveryService,
  ) {}

  async execute(
    adminUserId: string,
    requestId: string,
    reviewNotes?: string,
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

      const isRemovalRequest = claimRequest.requestType === "REMOVAL";
      const fromOrganizationId = place.organizationId;

      if (isRemovalRequest) {
        await this.placeRepository.update(
          place.id,
          {
            claimStatus: "UNCLAIMED",
            placeType: "CURATED",
            organizationId: null,
          },
          ctx,
        );

        await this.placeVerificationRepository.upsert(
          {
            placeId: place.id,
            status: "UNVERIFIED",
            verifiedAt: null,
            verifiedByUserId: null,
            reservationsEnabled: false,
            reservationsEnabledAt: null,
          },
          ctx,
        );
      } else {
        await this.placeRepository.update(
          place.id,
          {
            claimStatus: "CLAIMED",
            placeType: "RESERVABLE",
            organizationId: claimRequest.organizationId,
          },
          ctx,
        );
      }

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
          requestType: claimRequest.requestType,
          placeId: place.id,
          fromOrganizationId,
          toOrganizationId: isRemovalRequest
            ? null
            : (claimRequest.organizationId ?? place.organizationId),
          adminUserId,
        },
        isRemovalRequest
          ? "Removal request approved - place returned to curated"
          : "Claim request approved - place transformed to reservable",
      );

      if (claimRequest.organizationId) {
        await this.notificationDeliveryService.enqueueOwnerClaimReviewed(
          {
            requestId,
            organizationId: claimRequest.organizationId,
            placeId: place.id,
            placeName: place.name,
            status: "APPROVED",
            reviewNotes: reviewNotes ?? null,
          },
          ctx,
        );
      }

      return updatedRequest;
    });
  }
}
