import { logger } from "@/lib/shared/infra/logger";
import type { TransactionManager } from "@/lib/shared/kernel/transaction";
import type { RequestContext } from "@/lib/shared/kernel/context";
import type { CourtSubmissionRecord } from "@/lib/shared/infra/db/schema";
import { placeContactDetail } from "@/lib/shared/infra/db/schema";
import type { PlaceRepository } from "@/lib/modules/place/repositories/place.repository";
import { resolvePlaceSlug } from "@/lib/modules/place/helpers";
import type { GoogleLocService } from "@/lib/modules/google-loc/services/google-loc.service";
import type { DrizzleTransaction } from "@/lib/shared/infra/db/types";
import type { CourtSubmissionRepository } from "../repositories/court-submission.repository";
import type { CourtSubmissionBanRepository } from "../repositories/court-submission-ban.repository";
import type { SubmitCourtInput } from "../court-submission.dto";
import {
  DailySubmissionQuotaExceededError,
  InvalidGoogleMapsLinkError,
  UserBannedFromSubmissionsError,
} from "../errors/court-submission.errors";

const MAX_DAILY_SUBMISSIONS = 10;
const DEFAULT_COUNTRY = "PH";
const DEFAULT_TIME_ZONE = "Asia/Manila";

export class CourtSubmissionService {
  constructor(
    private submissionRepo: CourtSubmissionRepository,
    private banRepo: CourtSubmissionBanRepository,
    private placeRepo: PlaceRepository,
    private googleLocService: GoogleLocService,
    private transactionManager: TransactionManager,
  ) {}

  async submitCourt(
    userId: string,
    input: SubmitCourtInput,
  ): Promise<CourtSubmissionRecord> {
    // 1. Check ban
    const ban = await this.banRepo.findByUserId(userId);
    if (ban) {
      throw new UserBannedFromSubmissionsError();
    }

    // 2. Check daily quota
    const dailyCount = await this.submissionRepo.getDailyCount(userId);
    if (dailyCount >= MAX_DAILY_SUBMISSIONS) {
      throw new DailySubmissionQuotaExceededError();
    }

    // 3. Resolve coordinates
    let latitude: string;
    let longitude: string;

    if (input.locationMode === "link") {
      const preview = await this.googleLocService.preview({
        url: input.googleMapsLink!,
      });
      if (preview.lat == null || preview.lng == null) {
        throw new InvalidGoogleMapsLinkError();
      }
      latitude = preview.lat.toString();
      longitude = preview.lng.toString();
    } else {
      latitude = input.latitude!;
      longitude = input.longitude!;
    }

    // 4. Transaction: create place + submission
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      const client = tx as unknown as DrizzleTransaction;

      const slug = await resolvePlaceSlug({
        fallbackName: input.name,
        findBySlug: this.placeRepo.findBySlug.bind(this.placeRepo),
        ctx,
      });

      const placeRecord = await this.placeRepo.create(
        {
          organizationId: null,
          name: input.name,
          slug,
          address: input.address || input.city,
          city: input.city,
          province: input.province,
          country: DEFAULT_COUNTRY,
          latitude,
          longitude,
          timeZone: DEFAULT_TIME_ZONE,
          placeType: "CURATED",
          claimStatus: "UNCLAIMED",
          isActive: false,
        },
        ctx,
      );

      // Create contact details if any provided
      const hasContact =
        input.facebookUrl ||
        input.instagramUrl ||
        input.phoneNumber ||
        input.viberInfo ||
        input.websiteUrl ||
        input.otherContactInfo;

      if (hasContact) {
        await client.insert(placeContactDetail).values({
          placeId: placeRecord.id,
          facebookUrl: input.facebookUrl ?? null,
          instagramUrl: input.instagramUrl ?? null,
          phoneNumber: input.phoneNumber ?? null,
          viberInfo: input.viberInfo ?? null,
          websiteUrl: input.websiteUrl ?? null,
          otherContactInfo: input.otherContactInfo ?? null,
        });
      }

      // Create amenities if provided
      if (input.amenities?.length) {
        await this.placeRepo.createAmenities(
          placeRecord.id,
          input.amenities,
          ctx,
        );
      }

      const submission = await this.submissionRepo.create(
        {
          placeId: placeRecord.id,
          submittedByUserId: userId,
          status: "PENDING",
        },
        ctx,
      );

      logger.info(
        {
          event: "court_submission.created",
          submissionId: submission.id,
          placeId: placeRecord.id,
          userId,
        },
        "Court submitted by user",
      );

      return submission;
    });
  }

  async getMySubmissions(
    userId: string,
    options: { limit: number; offset: number },
  ) {
    return this.submissionRepo.findByUserId(userId, options);
  }

  async getDailyCount(userId: string): Promise<number> {
    return this.submissionRepo.getDailyCount(userId);
  }
}
