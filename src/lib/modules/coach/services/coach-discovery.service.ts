import {
  CoachNotActiveError,
  CoachNotFoundError,
} from "../errors/coach.errors";
import type {
  CoachCardMediaItem,
  CoachCardMetaItem,
  CoachDiscoveryFilters,
  CoachSummaryItem,
  CoachWithDetails,
  ICoachRepository,
} from "../repositories/coach.repository";

export interface CoachPublicDetails extends CoachWithDetails {
  meta: Omit<CoachCardMetaItem, "coachId">;
  media: Omit<CoachCardMediaItem, "coachId"> | null;
}

export interface ICoachDiscoveryService {
  getCoachByIdOrSlug(idOrSlug: string): Promise<CoachPublicDetails>;
  listCoachSummaries(filters: CoachDiscoveryFilters): Promise<{
    items: CoachSummaryItem[];
    total: number;
  }>;
  listCoachCardMediaByIds(coachIds: string[]): Promise<CoachCardMediaItem[]>;
  listCoachCardMetaByIds(coachIds: string[]): Promise<CoachCardMetaItem[]>;
  getPublicStats(): Promise<{
    totalCoaches: number;
    totalCities: number;
    totalSports: number;
  }>;
}

export class CoachDiscoveryService implements ICoachDiscoveryService {
  constructor(private readonly coachRepository: ICoachRepository) {}

  async getCoachByIdOrSlug(idOrSlug: string): Promise<CoachPublicDetails> {
    const normalized = idOrSlug.trim();
    if (!normalized) {
      throw new CoachNotFoundError(idOrSlug);
    }

    const coachRecord = await this.coachRepository.findByIdOrSlug(normalized);
    if (!coachRecord) {
      throw new CoachNotFoundError(idOrSlug);
    }

    if (!coachRecord.isActive) {
      throw new CoachNotActiveError(coachRecord.id);
    }

    const details = await this.coachRepository.findWithDetails(coachRecord.id);
    if (!details) {
      throw new CoachNotFoundError(coachRecord.id);
    }

    const [meta, media] = await Promise.all([
      this.coachRepository.listCardMetaByCoachIds([coachRecord.id]),
      this.coachRepository.listCardMediaByCoachIds([coachRecord.id]),
    ]);

    const resolvedMeta = meta[0];

    return {
      ...details,
      meta: resolvedMeta
        ? {
            sports: resolvedMeta.sports,
            sessionTypes: resolvedMeta.sessionTypes,
            baseHourlyRateCents: resolvedMeta.baseHourlyRateCents,
            currency: resolvedMeta.currency,
            averageRating: resolvedMeta.averageRating,
            reviewCount: resolvedMeta.reviewCount,
            verified: resolvedMeta.verified,
          }
        : {
            sports: [],
            sessionTypes: [],
            baseHourlyRateCents: details.coach.baseHourlyRateCents,
            currency: details.coach.baseHourlyRateCurrency,
            averageRating: null,
            reviewCount: 0,
            verified: false,
          },
      media: media[0]
        ? {
            avatarUrl: media[0].avatarUrl,
            primaryPhotoUrl: media[0].primaryPhotoUrl,
          }
        : null,
    };
  }

  async listCoachSummaries(filters: CoachDiscoveryFilters) {
    return this.coachRepository.listSummary(filters);
  }

  async listCoachCardMediaByIds(coachIds: string[]) {
    return this.coachRepository.listCardMediaByCoachIds(coachIds);
  }

  async listCoachCardMetaByIds(coachIds: string[]) {
    return this.coachRepository.listCardMetaByCoachIds(coachIds);
  }

  async getPublicStats() {
    return this.coachRepository.getPublicStats();
  }
}
