import { getContainer } from "@/lib/shared/infra/container";
import { UserNotificationRepository } from "../repositories/user-notification.repository";
import { UserNotificationService } from "../services/user-notification.service";

let userNotificationRepository: UserNotificationRepository | null = null;
let userNotificationService: UserNotificationService | null = null;

export function makeUserNotificationRepository(): UserNotificationRepository {
  if (!userNotificationRepository) {
    userNotificationRepository = new UserNotificationRepository(
      getContainer().db,
    );
  }
  return userNotificationRepository;
}

export function makeUserNotificationService(): UserNotificationService {
  if (!userNotificationService) {
    userNotificationService = new UserNotificationService(
      makeUserNotificationRepository(),
      getContainer().transactionManager,
    );
  }
  return userNotificationService;
}
