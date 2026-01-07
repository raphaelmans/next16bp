import type { RequestContext } from "@/shared/kernel/context";
import type {
  ICourtRepository,
  CourtWithDetails,
  PaginatedCourts,
} from "../repositories/court.repository";
import type { SearchCourtsDTO, ListCourtsByCityDTO } from "../dtos";
import { CourtNotFoundError } from "../errors/court.errors";

export interface ICourtDiscoveryService {
  getCourtById(id: string, ctx?: RequestContext): Promise<CourtWithDetails>;
  searchCourts(
    filters: SearchCourtsDTO,
    ctx?: RequestContext,
  ): Promise<PaginatedCourts>;
  listCourtsByCity(
    params: ListCourtsByCityDTO,
    ctx?: RequestContext,
  ): Promise<PaginatedCourts>;
}

export class CourtDiscoveryService implements ICourtDiscoveryService {
  constructor(private courtRepository: ICourtRepository) {}

  async getCourtById(
    id: string,
    ctx?: RequestContext,
  ): Promise<CourtWithDetails> {
    const courtWithDetails = await this.courtRepository.findWithDetails(
      id,
      ctx,
    );

    if (!courtWithDetails) {
      throw new CourtNotFoundError(id);
    }

    // Only return active courts
    if (!courtWithDetails.court.isActive) {
      throw new CourtNotFoundError(id);
    }

    return courtWithDetails;
  }

  async searchCourts(
    filters: SearchCourtsDTO,
    ctx?: RequestContext,
  ): Promise<PaginatedCourts> {
    return this.courtRepository.search(filters, ctx);
  }

  async listCourtsByCity(
    params: ListCourtsByCityDTO,
    ctx?: RequestContext,
  ): Promise<PaginatedCourts> {
    return this.courtRepository.listByCity(
      params.city,
      { limit: params.limit, offset: params.offset },
      ctx,
    );
  }
}
