import type { RequestContext } from "@/shared/kernel/context";
import { CourtNotFoundError } from "../errors/court.errors";
import type {
  CourtWithSport,
  ICourtRepository,
} from "../repositories/court.repository";

export interface ICourtDiscoveryService {
  getCourtById(id: string, ctx?: RequestContext): Promise<CourtWithSport>;
}

export class CourtDiscoveryService implements ICourtDiscoveryService {
  constructor(private courtRepository: ICourtRepository) {}

  async getCourtById(
    id: string,
    ctx?: RequestContext,
  ): Promise<CourtWithSport> {
    const courtWithSport = await this.courtRepository.findByIdWithSport(
      id,
      ctx,
    );
    if (!courtWithSport) {
      throw new CourtNotFoundError(id);
    }

    if (!courtWithSport.court.isActive) {
      throw new CourtNotFoundError(id);
    }

    return courtWithSport;
  }
}
