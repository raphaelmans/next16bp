import { makeMobilePushTokenRepository } from "@/lib/modules/mobile-push-token/factories/mobile-push-token.factory";
import { makePushSubscriptionRepository } from "@/lib/modules/push-subscription/factories/push-subscription.factory";
import { makeUserNotificationRepository } from "@/lib/modules/user-notification/factories/user-notification.factory";
import { getContainer } from "@/lib/shared/infra/container";
import { NotificationDeliveryJobRepository } from "../repositories/notification-delivery-job.repository";
import { NotificationRecipientRepository } from "../repositories/notification-recipient.repository";
import { NotificationDeliveryService } from "../services/notification-delivery.service";

let notificationDeliveryJobRepository: NotificationDeliveryJobRepository | null =
  null;
let notificationRecipientRepository: NotificationRecipientRepository | null =
  null;
let notificationDeliveryService: NotificationDeliveryService | null = null;

export function makeNotificationDeliveryJobRepository() {
  if (!notificationDeliveryJobRepository) {
    notificationDeliveryJobRepository = new NotificationDeliveryJobRepository(
      getContainer().db,
    );
  }
  return notificationDeliveryJobRepository;
}

export function makeNotificationRecipientRepository() {
  if (!notificationRecipientRepository) {
    notificationRecipientRepository = new NotificationRecipientRepository(
      getContainer().db,
    );
  }
  return notificationRecipientRepository;
}

export function makeNotificationDeliveryService() {
  if (!notificationDeliveryService) {
    notificationDeliveryService = new NotificationDeliveryService(
      makeNotificationDeliveryJobRepository(),
      makeNotificationRecipientRepository(),
      makePushSubscriptionRepository(),
      makeMobilePushTokenRepository(),
      makeUserNotificationRepository(),
    );
  }
  return notificationDeliveryService;
}
