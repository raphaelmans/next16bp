import { getContainer } from "@/lib/shared/infra/container";
import { UserPreferenceRepository } from "../repositories/user-preference.repository";
import { UserPreferenceService } from "../services/user-preference.service";

let userPreferenceRepository: UserPreferenceRepository | null = null;
let userPreferenceService: UserPreferenceService | null = null;

export function makeUserPreferenceRepository(): UserPreferenceRepository {
  if (!userPreferenceRepository) {
    userPreferenceRepository = new UserPreferenceRepository(getContainer().db);
  }
  return userPreferenceRepository;
}

export function makeUserPreferenceService(): UserPreferenceService {
  if (!userPreferenceService) {
    userPreferenceService = new UserPreferenceService(
      makeUserPreferenceRepository(),
      getContainer().transactionManager,
    );
  }
  return userPreferenceService;
}
