import { eq } from "drizzle-orm";
import { profile, userRoles } from "@/lib/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/lib/shared/infra/db/types";
import type { RequestContext } from "@/lib/shared/kernel/context";

export type AdminRecipient = {
  userId: string;
  email: string | null;
  phoneNumber: string | null;
};

export interface INotificationRecipientRepository {
  findAdminRecipients(ctx?: RequestContext): Promise<AdminRecipient[]>;
}

export class NotificationRecipientRepository
  implements INotificationRecipientRepository
{
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findAdminRecipients(ctx?: RequestContext): Promise<AdminRecipient[]> {
    const client = this.getClient(ctx);
    const result = await client
      .select({
        userId: userRoles.userId,
        email: profile.email,
        phoneNumber: profile.phoneNumber,
      })
      .from(userRoles)
      .leftJoin(profile, eq(profile.userId, userRoles.userId))
      .where(eq(userRoles.role, "admin"));

    return result.map((row) => ({
      userId: row.userId,
      email: row.email ?? null,
      phoneNumber: row.phoneNumber ?? null,
    }));
  }
}
