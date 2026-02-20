import { getContainer } from "@/lib/shared/infra/container";
import { MobilePushTokenRepository } from "../repositories/mobile-push-token.repository";
import { MobilePushTokenService } from "../services/mobile-push-token.service";

let repo: MobilePushTokenRepository | null = null;
let service: MobilePushTokenService | null = null;

export function makeMobilePushTokenRepository(): MobilePushTokenRepository {
  if (!repo) {
    repo = new MobilePushTokenRepository(getContainer().db);
  }
  return repo;
}

export function makeMobilePushTokenService(): MobilePushTokenService {
  if (!service) {
    service = new MobilePushTokenService(
      makeMobilePushTokenRepository(),
      getContainer().transactionManager,
    );
  }
  return service;
}
