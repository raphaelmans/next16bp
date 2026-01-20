import { v4 as uuidv4 } from "uuid";
import { OrganizationNotFoundError } from "@/modules/organization/errors/organization.errors";
import type { IOrganizationRepository } from "@/modules/organization/repositories/organization.repository";
import { PlaceNotFoundError } from "@/modules/place/errors/place.errors";
import type { IPlaceRepository } from "@/modules/place/repositories/place.repository";
import { STORAGE_BUCKETS } from "@/modules/storage/dtos";
import type { IObjectStorageService } from "@/modules/storage/services/object-storage.service";
import type { PlaceRecord } from "@/shared/infra/db/schema";
import { logger } from "@/shared/infra/logger";
import type { RequestContext } from "@/shared/kernel/context";
import type { TransactionManager } from "@/shared/kernel/transaction";
import type {
  GetPlaceVerificationByPlaceDTO,
  SubmitPlaceVerificationDTO,
  TogglePlaceReservationsDTO,
} from "../dtos";
import {
  NotPlaceOwnerError,
  PlaceNotBookableError,
  PlaceVerificationAlreadyPendingError,
  PlaceVerificationDocumentsRequiredError,
  PlaceVerificationNotFoundError,
} from "../errors/place-verification.errors";
import type {
  IPlaceVerificationRepository,
  IPlaceVerificationRequestDocumentRepository,
  IPlaceVerificationRequestEventRepository,
  IPlaceVerificationRequestRepository,
} from "../repositories/place-verification.repository";

export interface PlaceVerificationDetails {
  place: PlaceRecord;
  verification: Awaited<
    ReturnType<IPlaceVerificationRepository["findByPlaceId"]>
  >;
  request: Awaited<
    ReturnType<IPlaceVerificationRequestRepository["findPendingByPlaceId"]>
  >;
}

export interface IPlaceVerificationService {
  submitRequest(
    userId: string,
    data: SubmitPlaceVerificationDTO,
  ): Promise<void>;
  getByPlace(
    userId: string,
    data: GetPlaceVerificationByPlaceDTO,
  ): Promise<{
    verification: Awaited<
      ReturnType<IPlaceVerificationRepository["findByPlaceId"]>
    >;
    request: Awaited<
      ReturnType<IPlaceVerificationRequestRepository["findPendingByPlaceId"]>
    >;
  }>;
  toggleReservations(
    userId: string,
    data: TogglePlaceReservationsDTO,
  ): Promise<void>;
}

export class PlaceVerificationService implements IPlaceVerificationService {
  constructor(
    private placeVerificationRepository: IPlaceVerificationRepository,
    private placeVerificationRequestRepository: IPlaceVerificationRequestRepository,
    private placeVerificationRequestEventRepository: IPlaceVerificationRequestEventRepository,
    private placeVerificationRequestDocumentRepository: IPlaceVerificationRequestDocumentRepository,
    private storageService: IObjectStorageService,
    private transactionManager: TransactionManager,
    private placeRepository: IPlaceRepository,
    private organizationRepository: IOrganizationRepository,
  ) {}

  async submitRequest(
    userId: string,
    data: SubmitPlaceVerificationDTO,
  ): Promise<void> {
    if (!data.documents?.length) {
      throw new PlaceVerificationDocumentsRequiredError();
    }

    await this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      const place = await this.placeRepository.findById(data.placeId, ctx);
      if (!place) {
        throw new PlaceNotFoundError(data.placeId);
      }

      if (!place.organizationId) {
        throw new NotPlaceOwnerError();
      }

      const organization = await this.organizationRepository.findById(
        place.organizationId,
        ctx,
      );
      if (!organization) {
        throw new OrganizationNotFoundError(place.organizationId);
      }

      if (organization.ownerUserId !== userId) {
        throw new NotPlaceOwnerError();
      }

      const pending =
        await this.placeVerificationRequestRepository.findPendingByPlaceId(
          data.placeId,
          ctx,
        );
      if (pending) {
        throw new PlaceVerificationAlreadyPendingError(data.placeId);
      }

      const request = await this.placeVerificationRequestRepository.create(
        {
          placeId: data.placeId,
          organizationId: place.organizationId,
          status: "PENDING",
          requestedByUserId: userId,
          requestNotes: data.requestNotes ?? null,
        },
        ctx,
      );

      await this.placeVerificationRequestEventRepository.create(
        {
          placeVerificationRequestId: request.id,
          fromStatus: null,
          toStatus: "PENDING",
          triggeredByUserId: userId,
          notes: "Owner submitted verification request",
        },
        ctx,
      );

      await this.placeVerificationRepository.upsert(
        {
          placeId: data.placeId,
          status: "PENDING",
          reservationsEnabled: false,
          reservationsEnabledAt: null,
        },
        ctx,
      );

      const documents = await Promise.all(
        data.documents.map(async (file) => {
          const docId = uuidv4();
          const ext = file.name.split(".").pop() || "bin";
          const path = `${data.placeId}/${request.id}/${docId}.${ext}`;

          const result = await this.storageService.upload({
            bucket: STORAGE_BUCKETS.PLACE_VERIFICATION_DOCS,
            path,
            file,
            upsert: false,
          });

          return {
            placeVerificationRequestId: request.id,
            fileUrl: result.url,
            mimeType: file.type,
            fileName: file.name,
            sizeBytes: file.size,
            docType: null,
          };
        }),
      );

      await this.placeVerificationRequestDocumentRepository.createMany(
        documents,
        ctx,
      );

      logger.info(
        {
          event: "place_verification.requested",
          requestId: request.id,
          placeId: data.placeId,
          userId,
        },
        "Place verification request submitted",
      );
    });
  }

  async getByPlace(
    userId: string,
    data: GetPlaceVerificationByPlaceDTO,
  ): Promise<{
    verification: Awaited<
      ReturnType<IPlaceVerificationRepository["findByPlaceId"]>
    >;
    request: Awaited<
      ReturnType<IPlaceVerificationRequestRepository["findPendingByPlaceId"]>
    >;
  }> {
    const place = await this.placeRepository.findById(data.placeId);
    if (!place) {
      throw new PlaceNotFoundError(data.placeId);
    }

    if (!place.organizationId) {
      throw new NotPlaceOwnerError();
    }

    const organization = await this.organizationRepository.findById(
      place.organizationId,
    );
    if (!organization || organization.ownerUserId !== userId) {
      throw new NotPlaceOwnerError();
    }

    const verification = await this.placeVerificationRepository.findByPlaceId(
      data.placeId,
    );
    const request =
      await this.placeVerificationRequestRepository.findPendingByPlaceId(
        data.placeId,
      );

    return { verification, request };
  }

  async toggleReservations(
    userId: string,
    data: TogglePlaceReservationsDTO,
  ): Promise<void> {
    const place = await this.placeRepository.findById(data.placeId);
    if (!place) {
      throw new PlaceNotFoundError(data.placeId);
    }

    if (!place.organizationId) {
      throw new NotPlaceOwnerError();
    }

    const organization = await this.organizationRepository.findById(
      place.organizationId,
    );
    if (!organization || organization.ownerUserId !== userId) {
      throw new NotPlaceOwnerError();
    }

    const verification = await this.placeVerificationRepository.findByPlaceId(
      data.placeId,
    );
    if (!verification) {
      throw new PlaceVerificationNotFoundError(data.placeId);
    }

    if (data.enabled && verification.status !== "VERIFIED") {
      throw new PlaceNotBookableError(data.placeId);
    }

    await this.placeVerificationRepository.update(data.placeId, {
      reservationsEnabled: data.enabled,
      reservationsEnabledAt: data.enabled ? new Date() : null,
    });
  }
}
