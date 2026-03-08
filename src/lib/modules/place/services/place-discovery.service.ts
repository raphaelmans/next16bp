import pLimit from "p-limit";
import { formatInTimeZone } from "@/common/format";
import { getZonedDayStartIsoFromDayKey } from "@/common/time-zone";
import type { IAvailabilityService } from "@/lib/modules/availability/services/availability.service";
import type {
  CourtWithSport,
  ICourtRepository,
} from "@/lib/modules/court/repositories/court.repository";
import type { PlaceReviewRepository } from "@/lib/modules/place-review/repositories/place-review.repository";
import { isUuid } from "@/lib/slug";
import type { ListPlacesDTO } from "../dtos";
import { PlaceNotFoundError } from "../errors/place.errors";
import type {
  IPlaceRepository,
  PlaceCardMediaItem,
  PlaceCardMetaItem,
  PlaceListItem,
  PlaceSummaryItem,
  PlaceSummaryMeta,
  PlaceWithDetails,
} from "../repositories/place.repository";

export interface PlaceDetails extends PlaceWithDetails {
  courts: CourtWithSport[];
  sports: { id: string; slug: string; name: string }[];
}

export interface IPlaceDiscoveryService {
  getPlaceById(placeId: string): Promise<PlaceDetails>;
  getPlaceByIdOrSlug(placeIdOrSlug: string): Promise<PlaceDetails>;
  listPlaces(filters: ListPlacesDTO): Promise<{
    items: PlaceListItem[];
    total: number;
  }>;
  listPlaceSummaries(filters: ListPlacesDTO): Promise<{
    items: PlaceSummaryItem[];
    total: number;
  }>;
  listPlaceCardMediaByIds(placeIds: string[]): Promise<PlaceCardMediaItem[]>;
  listPlaceCardMetaByIds(
    placeIds: string[],
    sportId?: string,
  ): Promise<PlaceCardMetaItem[]>;
  listAmenities(): Promise<string[]>;
  getPublicStats(): Promise<{
    totalPlaces: number;
    totalCourts: number;
    totalCities: number;
  }>;
}

export class PlaceDiscoveryService implements IPlaceDiscoveryService {
  constructor(
    private placeRepository: IPlaceRepository,
    private courtRepository: ICourtRepository,
    private availabilityService: IAvailabilityService,
    private placeReviewRepository?: PlaceReviewRepository,
  ) {}

  async getPlaceById(placeId: string): Promise<PlaceDetails> {
    const place = await this.placeRepository.findWithDetails(placeId);
    if (!place) {
      throw new PlaceNotFoundError(placeId);
    }

    return this.buildPlaceDetails(placeId, place);
  }

  async getPlaceByIdOrSlug(placeIdOrSlug: string): Promise<PlaceDetails> {
    const value = placeIdOrSlug.trim();
    if (!value) {
      throw new PlaceNotFoundError(placeIdOrSlug);
    }

    let place: PlaceWithDetails | null = null;
    if (isUuid(value)) {
      place = await this.placeRepository.findWithDetails(value);
    }
    if (!place) {
      place = await this.placeRepository.findWithDetailsBySlug(value);
    }
    if (!place) {
      throw new PlaceNotFoundError(placeIdOrSlug);
    }

    return this.buildPlaceDetails(place.place.id, place);
  }

  private async buildPlaceDetails(
    placeId: string,
    place: PlaceWithDetails,
  ): Promise<PlaceDetails> {
    const courts = await this.courtRepository.findByPlaceWithSport(placeId);
    const sportsMap = new Map(
      courts.map((courtWithSport) => [
        courtWithSport.sport.id,
        {
          id: courtWithSport.sport.id,
          slug: courtWithSport.sport.slug,
          name: courtWithSport.sport.name,
        },
      ]),
    );

    return {
      ...place,
      courts,
      sports: Array.from(sportsMap.values()),
    };
  }

  async listPlaces(filters: ListPlacesDTO): Promise<{
    items: PlaceListItem[];
    total: number;
  }> {
    return this.placeRepository.list({
      q: filters.q,
      province: filters.province,
      city: filters.city,
      sportId: filters.sportId,
      amenities: filters.amenities,
      verificationTier: filters.verificationTier,
      featuredOnly: filters.featuredOnly,
      limit: filters.limit,
      offset: filters.offset,
    });
  }

  async listPlaceSummaries(filters: ListPlacesDTO): Promise<{
    items: PlaceSummaryItem[];
    total: number;
  }> {
    let result: { items: PlaceSummaryItem[]; total: number };

    if (filters.date) {
      result = await this.listAvailabilityAwarePlaceSummaries({
        ...filters,
        date: filters.date,
      });
    } else {
      result = await this.placeRepository.listSummary({
        q: filters.q,
        province: filters.province,
        city: filters.city,
        sportId: filters.sportId,
        amenities: filters.amenities,
        verificationTier: filters.verificationTier,
        featuredOnly: filters.featuredOnly,
        limit: filters.limit,
        offset: filters.offset,
      });
    }

    return this.enrichSummariesWithMeta(result, filters.sportId);
  }

  private async enrichSummariesWithMeta(
    result: { items: PlaceSummaryItem[]; total: number },
    sportId?: string,
  ): Promise<{ items: PlaceSummaryItem[]; total: number }> {
    const placeIds = result.items.map((item) => item.place.id);
    if (placeIds.length === 0) return result;

    const [metaItems, reviewAggregates] = await Promise.all([
      this.placeRepository.listCardMetaByPlaceIds(placeIds, sportId),
      this.placeReviewRepository
        ? this.placeReviewRepository.getAggregatesByPlaceIds(placeIds)
        : Promise.resolve(new Map<string, never>()),
    ]);

    const metaByPlaceId = new Map(
      metaItems.map((item) => [item.placeId, item]),
    );

    return {
      items: result.items.map((item) => {
        const metaItem = metaByPlaceId.get(item.place.id);
        const review = reviewAggregates.get(item.place.id);
        if (!metaItem) return item;

        const meta: PlaceSummaryMeta = {
          sports: metaItem.sports,
          courtCount: metaItem.courtCount,
          lowestPriceCents: metaItem.lowestPriceCents,
          currency: metaItem.currency,
          verificationStatus: metaItem.verificationStatus,
          reservationsEnabled: metaItem.reservationsEnabled,
          hasPaymentMethods: metaItem.hasPaymentMethods,
          averageRating: review?.averageRating ?? null,
          reviewCount: review?.reviewCount ?? null,
        };

        return { ...item, meta };
      }),
      total: result.total,
    };
  }

  private async listAvailabilityAwarePlaceSummaries(
    filters: ListPlacesDTO & { date: string },
  ): Promise<{
    items: PlaceSummaryItem[];
    total: number;
  }> {
    const batchSize = Math.max(filters.limit * 2, 24);
    const limit = pLimit(4);
    const matchedItems: PlaceSummaryItem[] = [];
    let offset = 0;
    let totalCandidates = 0;

    while (offset === 0 || offset < totalCandidates) {
      const batch = await this.placeRepository.listSummary({
        q: filters.q,
        province: filters.province,
        city: filters.city,
        sportId: filters.sportId,
        amenities: filters.amenities,
        verificationTier: filters.verificationTier,
        featuredOnly: filters.featuredOnly,
        limit: batchSize,
        offset,
      });

      totalCandidates = batch.total;
      if (batch.items.length === 0) {
        break;
      }

      const matchedBatch = await Promise.all(
        batch.items.map((item) =>
          limit(() =>
            this.buildAvailabilityAwareSummaryItem(item, {
              sportId: filters.sportId,
              date: filters.date,
              time: filters.time,
            }),
          ),
        ),
      );

      matchedItems.push(
        ...matchedBatch.filter((item): item is PlaceSummaryItem =>
          Boolean(item),
        ),
      );

      offset += batch.items.length;
    }

    return {
      items: matchedItems.slice(filters.offset, filters.offset + filters.limit),
      total: matchedItems.length,
    };
  }

  private async buildAvailabilityAwareSummaryItem(
    item: PlaceSummaryItem,
    filters: { sportId?: string; date: string; time?: string[] },
  ): Promise<PlaceSummaryItem | null> {
    if (item.place.placeType !== "RESERVABLE") {
      return null;
    }

    if (filters.sportId) {
      return this.checkAvailabilityForSport(
        item,
        filters as { sportId: string; date: string; time?: string[] },
      );
    }

    // No sportId — check all sports at this place
    const courts = await this.courtRepository.findByPlaceWithSport(
      item.place.id,
    );
    const sportMap = new Map<string, string>();
    for (const c of courts) {
      sportMap.set(c.sport.id, c.sport.name);
    }

    let bestResult: PlaceSummaryItem | null = null;
    let bestMatchCount = 0;

    for (const [sportId, sportName] of sportMap) {
      const result = await this.checkAvailabilityForSport(item, {
        sportId,
        date: filters.date,
        time: filters.time,
      });
      if (result?.availabilityPreview) {
        const count = result.availabilityPreview.matchCount;
        if (count > bestMatchCount) {
          bestMatchCount = count;
          bestResult = {
            ...result,
            availabilityPreview: {
              ...result.availabilityPreview,
              sportName,
              sportId,
            },
          };
        }
      }
    }

    return bestResult;
  }

  private async checkAvailabilityForSport(
    item: PlaceSummaryItem,
    filters: { sportId: string; date: string; time?: string[] },
  ): Promise<PlaceSummaryItem | null> {
    const availability = await this.availabilityService.getForPlaceSport({
      placeId: item.place.id,
      sportId: filters.sportId,
      date: getZonedDayStartIsoFromDayKey(filters.date, item.place.timeZone),
      durationMinutes: 60,
      includeUnavailable: false,
      includeCourtOptions: false,
    });

    const matchedOptions = availability.options.filter((option) => {
      if (!filters.time) {
        return true;
      }

      return filters.time.includes(
        formatInTimeZone(option.startTime, item.place.timeZone, "HH:mm"),
      );
    });

    const matchedStartTime = matchedOptions[0]?.startTime;
    if (!matchedStartTime) {
      return null;
    }

    return {
      ...item,
      availabilityPreview: {
        requestedDate: filters.date,
        requestedTime: filters.time,
        matchedStartTime,
        matchCount: matchedOptions.length,
        timeZone: item.place.timeZone,
      },
    };
  }

  async listPlaceCardMediaByIds(
    placeIds: string[],
  ): Promise<PlaceCardMediaItem[]> {
    return this.placeRepository.listCardMediaByPlaceIds(placeIds);
  }

  async listPlaceCardMetaByIds(
    placeIds: string[],
    sportId?: string,
  ): Promise<PlaceCardMetaItem[]> {
    const [metaItems, reviewAggregates] = await Promise.all([
      this.placeRepository.listCardMetaByPlaceIds(placeIds, sportId),
      this.placeReviewRepository
        ? this.placeReviewRepository.getAggregatesByPlaceIds(placeIds)
        : Promise.resolve(new Map()),
    ]);

    return metaItems.map((item) => {
      const aggregate = reviewAggregates.get(item.placeId);
      return {
        ...item,
        averageRating: aggregate?.averageRating ?? null,
        reviewCount: aggregate?.reviewCount ?? null,
      };
    });
  }

  async listAmenities(): Promise<string[]> {
    return this.placeRepository.listAmenities();
  }

  async getPublicStats() {
    return this.placeRepository.getPublicStats();
  }
}
