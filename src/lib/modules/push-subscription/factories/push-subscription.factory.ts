import { getContainer } from "@/lib/shared/infra/container";
import { PushSubscriptionRepository } from "../repositories/push-subscription.repository";
import { PushSubscriptionService } from "../services/push-subscription.service";

let repo: PushSubscriptionRepository | null = null;
let service: PushSubscriptionService | null = null;

export function makePushSubscriptionRepository(): PushSubscriptionRepository {
  if (!repo) {
    repo = new PushSubscriptionRepository(getContainer().db);
  }
  return repo;
}

export function makePushSubscriptionService(): PushSubscriptionService {
  if (!service) {
    service = new PushSubscriptionService(
      makePushSubscriptionRepository(),
      getContainer().transactionManager,
    );
  }
  return service;
}
