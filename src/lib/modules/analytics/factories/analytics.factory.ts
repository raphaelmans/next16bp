import { getContainer } from "@/lib/shared/infra/container";
import { AnalyticsRepository } from "../repositories/analytics.repository";
import { AnalyticsService } from "../services/analytics.service";

let analyticsRepository: AnalyticsRepository | null = null;
let analyticsService: AnalyticsService | null = null;

export function makeAnalyticsRepository(): AnalyticsRepository {
  if (!analyticsRepository) {
    analyticsRepository = new AnalyticsRepository(getContainer().db);
  }
  return analyticsRepository;
}

export function makeAnalyticsService(): AnalyticsService {
  if (!analyticsService) {
    analyticsService = new AnalyticsService(makeAnalyticsRepository());
  }
  return analyticsService;
}
