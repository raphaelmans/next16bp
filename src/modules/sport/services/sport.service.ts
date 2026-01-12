import type { SportRecord } from "@/shared/infra/db/schema";
import type { RequestContext } from "@/shared/kernel/context";
import type { ISportRepository } from "../repositories/sport.repository";

export interface ISportService {
  listSports(ctx?: RequestContext): Promise<SportRecord[]>;
}

export class SportService implements ISportService {
  constructor(private sportRepository: ISportRepository) {}

  async listSports(ctx?: RequestContext): Promise<SportRecord[]> {
    return this.sportRepository.list(ctx);
  }
}
