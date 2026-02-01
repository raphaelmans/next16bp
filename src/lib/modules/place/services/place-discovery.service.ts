import type {
  CourtWithSport,
  ICourtRepository,
} from "@/lib/modules/court/repositories/court.repository";
import { isUuid } from "@/lib/slug";
import type { ListPlacesDTO } from "../dtos";
import { PlaceNotFoundError } from "../errors/place.errors";
import type {
  IPlaceRepository,
  PlaceCardMediaItem,
  PlaceCardMetaItem,
  PlaceListItem,
  PlaceSummaryItem,
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
    return this.placeRepository.listSummary({
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

  async listPlaceCardMediaByIds(
    placeIds: string[],
  ): Promise<PlaceCardMediaItem[]> {
    return this.placeRepository.listCardMediaByPlaceIds(placeIds);
  }

  async listPlaceCardMetaByIds(
    placeIds: string[],
    sportId?: string,
  ): Promise<PlaceCardMetaItem[]> {
    return this.placeRepository.listCardMetaByPlaceIds(placeIds, sportId);
  }

  async listAmenities(): Promise<string[]> {
    return this.placeRepository.listAmenities();
  }

  async getPublicStats() {
    return this.placeRepository.getPublicStats();
  }
}
