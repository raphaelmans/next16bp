import type {
  InsertUserNotification,
  UserNotificationRecord,
} from "@/lib/shared/infra/db/schema";
import { logger } from "@/lib/shared/infra/logger";
import type { RequestContext } from "@/lib/shared/kernel/context";
import type { TransactionManager } from "@/lib/shared/kernel/transaction";
import type {
  IUserNotificationRepository,
  UserNotificationListOptions,
} from "../repositories/user-notification.repository";

export interface IUserNotificationService {
  createMany(
    data: InsertUserNotification[],
    ctx?: RequestContext,
  ): Promise<UserNotificationRecord[]>;
  listMy(
    userId: string,
    options: UserNotificationListOptions,
    ctx?: RequestContext,
  ): Promise<UserNotificationRecord[]>;
  getUnreadCount(userId: string, ctx?: RequestContext): Promise<number>;
  markAsRead(
    userId: string,
    id: string,
    ctx?: RequestContext,
  ): Promise<UserNotificationRecord | null>;
  markAllAsRead(
    userId: string,
    ctx?: RequestContext,
  ): Promise<{ count: number }>;
}

export class UserNotificationService implements IUserNotificationService {
  constructor(
    private userNotificationRepository: IUserNotificationRepository,
    private transactionManager: TransactionManager,
  ) {}

  async createMany(
    data: InsertUserNotification[],
    ctx?: RequestContext,
  ): Promise<UserNotificationRecord[]> {
    if (!data.length) return [];

    const created = ctx?.tx
      ? await this.userNotificationRepository.createMany(data, ctx)
      : await this.transactionManager.run((tx) =>
          this.userNotificationRepository.createMany(data, { tx }),
        );

    if (created.length) {
      logger.info(
        {
          event: "user_notification.created_many",
          count: created.length,
        },
        "User notifications persisted",
      );
    }

    return created;
  }

  async listMy(
    userId: string,
    options: UserNotificationListOptions,
    ctx?: RequestContext,
  ): Promise<UserNotificationRecord[]> {
    return this.userNotificationRepository.listByUserId(userId, options, ctx);
  }

  async getUnreadCount(userId: string, ctx?: RequestContext): Promise<number> {
    return this.userNotificationRepository.countUnreadByUserId(userId, ctx);
  }

  async markAsRead(
    userId: string,
    id: string,
    ctx?: RequestContext,
  ): Promise<UserNotificationRecord | null> {
    const updated = ctx?.tx
      ? await this.userNotificationRepository.markAsRead(id, userId, ctx)
      : await this.transactionManager.run((tx) =>
          this.userNotificationRepository.markAsRead(id, userId, { tx }),
        );

    if (updated) {
      logger.info(
        {
          event: "user_notification.mark_as_read",
          userId,
          notificationId: id,
        },
        "Marked notification as read",
      );
    }

    return updated;
  }

  async markAllAsRead(
    userId: string,
    ctx?: RequestContext,
  ): Promise<{ count: number }> {
    const result = ctx?.tx
      ? await this.userNotificationRepository.markAllAsRead(userId, ctx)
      : await this.transactionManager.run((tx) =>
          this.userNotificationRepository.markAllAsRead(userId, { tx }),
        );

    logger.info(
      {
        event: "user_notification.mark_all_as_read",
        userId,
        count: result.count,
      },
      "Marked all notifications as read",
    );

    return result;
  }
}
