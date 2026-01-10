import { NotOrganizationOwnerError } from "@/modules/organization/errors/organization.errors";
import type { IOrganizationRepository } from "@/modules/organization/repositories/organization.repository";
import { logger } from "@/shared/infra/logger";
import type { RequestContext } from "@/shared/kernel/context";
import type { TransactionManager } from "@/shared/kernel/transaction";
import type { CreateReservableCourtDTO } from "../dtos";
import type {
  CourtWithDetails,
  ICourtRepository,
} from "../repositories/court.repository";
import type { ICourtAmenityRepository } from "../repositories/court-amenity.repository";
import type { ICourtPhotoRepository } from "../repositories/court-photo.repository";
import type { IReservableCourtDetailRepository } from "../repositories/reservable-court-detail.repository";

export interface ICreateReservableCourtUseCase {
  execute(
    userId: string,
    data: CreateReservableCourtDTO,
  ): Promise<CourtWithDetails>;
}

export class CreateReservableCourtUseCase
  implements ICreateReservableCourtUseCase
{
  constructor(
    private courtRepository: ICourtRepository,
    private reservableCourtDetailRepository: IReservableCourtDetailRepository,
    private courtPhotoRepository: ICourtPhotoRepository,
    private courtAmenityRepository: ICourtAmenityRepository,
    private organizationRepository: IOrganizationRepository,
    private transactionManager: TransactionManager,
  ) {}

  async execute(
    userId: string,
    data: CreateReservableCourtDTO,
  ): Promise<CourtWithDetails> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      // Verify user owns the organization
      const org = await this.organizationRepository.findById(
        data.organizationId,
        ctx,
      );
      if (!org || org.ownerUserId !== userId) {
        throw new NotOrganizationOwnerError();
      }

      // Create the court
      const court = await this.courtRepository.create(
        {
          organizationId: data.organizationId,
          name: data.name,
          address: data.address,
          city: data.city,
          latitude: data.latitude,
          longitude: data.longitude,
          courtType: "RESERVABLE",
          claimStatus: "CLAIMED", // Organization-created courts are already claimed
        },
        ctx,
      );

      // Create reservable court detail
      const detail = await this.reservableCourtDetailRepository.create(
        {
          courtId: court.id,
          isFree: data.isFree,
          defaultCurrency: data.defaultCurrency,
          paymentInstructions: data.paymentInstructions,
          gcashNumber: data.gcashNumber,
          bankName: data.bankName,
          bankAccountNumber: data.bankAccountNumber,
          bankAccountName: data.bankAccountName,
        },
        ctx,
      );

      // Create photos if provided
      const photos = [];
      if (data.photos?.length) {
        for (let i = 0; i < data.photos.length; i++) {
          const photo = await this.courtPhotoRepository.create(
            {
              courtId: court.id,
              url: data.photos[i],
              displayOrder: i,
            },
            ctx,
          );
          photos.push(photo);
        }
      }

      // Create amenities if provided
      const amenities = [];
      if (data.amenities?.length) {
        for (const amenityName of data.amenities) {
          const amenity = await this.courtAmenityRepository.create(
            {
              courtId: court.id,
              name: amenityName,
            },
            ctx,
          );
          amenities.push(amenity);
        }
      }

      logger.info(
        {
          event: "court.created",
          courtId: court.id,
          organizationId: data.organizationId,
          courtType: "RESERVABLE",
          userId,
        },
        "Reservable court created",
      );

      return {
        court,
        detail,
        photos,
        amenities,
        organization: org,
      };
    });
  }
}
