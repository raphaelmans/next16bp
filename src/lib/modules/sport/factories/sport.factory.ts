import { getContainer } from "@/lib/shared/infra/container";
import { SportRepository } from "../repositories/sport.repository";
import { SportService } from "../services/sport.service";

let sportRepository: SportRepository | null = null;
let sportService: SportService | null = null;

export function makeSportRepository(): SportRepository {
  if (!sportRepository) {
    sportRepository = new SportRepository(getContainer().db);
  }
  return sportRepository;
}

export function makeSportService(): SportService {
  if (!sportService) {
    sportService = new SportService(makeSportRepository());
  }
  return sportService;
}
