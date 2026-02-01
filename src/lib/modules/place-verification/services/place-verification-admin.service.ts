import type { IOrganizationRepository } from "@/lib/modules/organization/repositories/organization.repository";
import { PlaceNotFoundError } from "@/lib/modules/place/errors/place.errors";
import type { IPlaceRepository } from "@/lib/modules/place/repositories/place.repository";
import type { PlaceVerificationRequestRecord } from "@/lib/shared/infra/db/schema";
import { logger } from "@/lib/shared/infra/logger";
import type { RequestContext } from "@/lib/shared/kernel/context";
import type { TransactionManager } from "@/lib/shared/kernel/transaction";
import type {
  ApprovePlaceVerificationDTO,
  GetPlaceVerificationByIdDTO,
  ListPlaceVerificationRequestsDTO,
  ReviewPlaceVerificationDTO,
} from "../dtos";
import {
  PlaceVerificationAlreadyReviewedError,
  PlaceVerificationDocumentsRequiredError,
  PlaceVerificationRequestNotFoundError,
} from "../errors/place-verification.errors";
import type {
  IPlaceVerificationRepository,
  IPlaceVerificationRequestDocumentRepository,
  IPlaceVerificationRequestEventRepository,
  IPlaceVerificationRequestRepository,
} from "../repositories/place-verification.repository";

export interface PlaceVerificationAdminDetails {
  request: Awaited<ReturnType<IPlaceVerificationRequestRepository["findById"]>>;
  place: Awaited<ReturnType<IPlaceRepository["findById"]>>;
  organization: Awaited<ReturnType<IOrganizationRepository["findById"]>> | null;
  documents: Awaited<
    ReturnType<IPlaceVerificationRequestDocumentRepository["findByRequestId"]>
  >;
  events: Awaited<
    ReturnType<IPlaceVerificationRequestEventRepository["findByRequestId"]>
  >;
}

export class PlaceVerificationAdminService {
  constructor(
    private placeVerificationRepository: IPlaceVerificationRepository,
    private placeVerificationRequestRepository: IPlaceVerificationRequestRepository,
    private placeVerificationRequestEventRepository: IPlaceVerificationRequestEventRepository,
    private placeVerificationRequestDocumentRepository: IPlaceVerificationRequestDocumentRepository,
    private transactionManager: TransactionManager,
    private placeRepository: IPlaceRepository,
    private organizationRepository: IOrganizationRepository,
  ) {}

  async getPendingRequests(
    pagination: ListPlaceVerificationRequestsDTO,
    ctx?: RequestContext,
  ): Promise<{
    items: {
      request: PlaceVerificationRequestRecord;
      placeName: string;
    }[];
    total: number;
  }> {
    return this.placeVerificationRequestRepository.findPending(pagination, ctx);
  }

  async getById(
    data: GetPlaceVerificationByIdDTO,
    ctx?: RequestContext,
  ): Promise<PlaceVerificationAdminDetails> {
    const request = await this.placeVerificationRequestRepository.findById(
      data.id,
      ctx,
    );
    if (!request) {
      throw new PlaceVerificationRequestNotFoundError(data.id);
    }

    const place = await this.placeRepository.findById(request.placeId, ctx);
    if (!place) {
      throw new PlaceNotFoundError(request.placeId);
    }

    const organization = request.organizationId
      ? await this.organizationRepository.findById(request.organizationId, ctx)
      : null;

    const documents =
      await this.placeVerificationRequestDocumentRepository.findByRequestId(
        request.id,
        ctx,
      );
    const events =
      await this.placeVerificationRequestEventRepository.findByRequestId(
        request.id,
        ctx,
      );

    return {
      request,
      place,
      organization,
      documents,
      events,
    };
  }

  async approve(
    adminUserId: string,
    data: ApprovePlaceVerificationDTO,
  ): Promise<void> {
    await this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      const request =
        await this.placeVerificationRequestRepository.findByIdForUpdate(
          data.requestId,
          ctx,
        );
      if (!request) {
        throw new PlaceVerificationRequestNotFoundError(data.requestId);
      }

      if (request.status !== "PENDING") {
        throw new PlaceVerificationAlreadyReviewedError(request.status);
      }

      const docs =
        await this.placeVerificationRequestDocumentRepository.findByRequestId(
          request.id,
          ctx,
        );
      if (!docs.length) {
        throw new PlaceVerificationDocumentsRequiredError();
      }

      await this.placeVerificationRequestRepository.update(
        request.id,
        {
          status: "APPROVED",
          reviewerUserId: adminUserId,
          reviewedAt: new Date(),
          reviewNotes: data.reviewNotes ?? null,
        },
        ctx,
      );

      await this.placeVerificationRequestEventRepository.create(
        {
          placeVerificationRequestId: request.id,
          fromStatus: "PENDING",
          toStatus: "APPROVED",
          triggeredByUserId: adminUserId,
          notes: data.reviewNotes ?? null,
        },
        ctx,
      );

      await this.placeVerificationRepository.upsert(
        {
          placeId: request.placeId,
          status: "VERIFIED",
          verifiedAt: new Date(),
          verifiedByUserId: adminUserId,
          reservationsEnabled: true,
          reservationsEnabledAt: new Date(),
        },
        ctx,
      );

      await this.placeRepository.update(
        request.placeId,
        { placeType: "RESERVABLE" },
        ctx,
      );

      logger.info(
        {
          event: "place_verification.approved",
          requestId: request.id,
          placeId: request.placeId,
          adminUserId,
        },
        "Venue verification approved",
      );
    });
  }

  async reject(
    adminUserId: string,
    data: ReviewPlaceVerificationDTO,
  ): Promise<void> {
    await this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      const request =
        await this.placeVerificationRequestRepository.findByIdForUpdate(
          data.requestId,
          ctx,
        );
      if (!request) {
        throw new PlaceVerificationRequestNotFoundError(data.requestId);
      }

      if (request.status !== "PENDING") {
        throw new PlaceVerificationAlreadyReviewedError(request.status);
      }

      await this.placeVerificationRequestRepository.update(
        request.id,
        {
          status: "REJECTED",
          reviewerUserId: adminUserId,
          reviewedAt: new Date(),
          reviewNotes: data.reviewNotes,
        },
        ctx,
      );

      await this.placeVerificationRequestEventRepository.create(
        {
          placeVerificationRequestId: request.id,
          fromStatus: "PENDING",
          toStatus: "REJECTED",
          triggeredByUserId: adminUserId,
          notes: data.reviewNotes,
        },
        ctx,
      );

      await this.placeVerificationRepository.upsert(
        {
          placeId: request.placeId,
          status: "REJECTED",
          verifiedAt: null,
          verifiedByUserId: null,
          reservationsEnabled: false,
          reservationsEnabledAt: null,
        },
        ctx,
      );

      logger.info(
        {
          event: "place_verification.rejected",
          requestId: request.id,
          placeId: request.placeId,
          adminUserId,
        },
        "Venue verification rejected",
      );
    });
  }
}
