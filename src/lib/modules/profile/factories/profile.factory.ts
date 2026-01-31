import { makeObjectStorageService } from "@/lib/modules/storage/factories/storage.factory";
import { getContainer } from "@/lib/shared/infra/container";
import { ProfileRepository } from "../repositories/profile.repository";
import { ProfileService } from "../services/profile.service";

let profileRepository: ProfileRepository | null = null;
let profileService: ProfileService | null = null;

export function makeProfileRepository(): ProfileRepository {
  if (!profileRepository) {
    profileRepository = new ProfileRepository(getContainer().db);
  }
  return profileRepository;
}

export function makeProfileService(): ProfileService {
  if (!profileService) {
    profileService = new ProfileService(
      makeProfileRepository(),
      getContainer().transactionManager,
      makeObjectStorageService(),
    );
  }
  return profileService;
}
