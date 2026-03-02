import { and, desc, eq, inArray, sql } from "drizzle-orm";
import {
  type InsertOrganizationInvitation,
  type InsertOrganizationMember,
  type InsertOrganizationMemberNotificationPreference,
  type OrganizationInvitationRecord,
  type OrganizationMemberNotificationPreferenceRecord,
  type OrganizationMemberRecord,
  organizationInvitation,
  organizationMember,
  organizationMemberNotificationPreference,
  profile,
} from "@/lib/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/lib/shared/infra/db/types";
import type { RequestContext } from "@/lib/shared/kernel/context";
import type {
  OrganizationInvitationStatus,
  OrganizationMemberPermission,
} from "../shared/permissions";

export type OrganizationMemberListItem = {
  member: OrganizationMemberRecord;
  displayName: string | null;
  email: string | null;
  avatarUrl: string | null;
};

export type OrganizationInvitationListItem = {
  invitation: OrganizationInvitationRecord;
};

export interface IOrganizationMemberRepository {
  findActiveMembership(
    organizationId: string,
    userId: string,
    ctx?: RequestContext,
  ): Promise<OrganizationMemberRecord | null>;
  listActiveByOrganizationId(
    organizationId: string,
    ctx?: RequestContext,
  ): Promise<OrganizationMemberListItem[]>;
  listActiveUserIdsByOrganizationPermission(
    organizationId: string,
    permission: OrganizationMemberPermission,
    ctx?: RequestContext,
  ): Promise<string[]>;
  listAccessibleOrganizationIdsByPermission(
    userId: string,
    permission: OrganizationMemberPermission,
    organizationIds: string[],
    ctx?: RequestContext,
  ): Promise<string[]>;
  findReservationNotificationPreference(
    organizationId: string,
    userId: string,
    ctx?: RequestContext,
  ): Promise<OrganizationMemberNotificationPreferenceRecord | null>;
  upsertReservationNotificationPreference(
    data: InsertOrganizationMemberNotificationPreference,
    ctx?: RequestContext,
  ): Promise<OrganizationMemberNotificationPreferenceRecord>;
  listReservationNotificationEnabledUserIds(
    organizationId: string,
    userIds: string[],
    ctx?: RequestContext,
  ): Promise<string[]>;
  upsertActiveMembership(
    data: InsertOrganizationMember,
    ctx?: RequestContext,
  ): Promise<OrganizationMemberRecord>;
  updateMembershipRolePermissions(
    organizationId: string,
    memberUserId: string,
    data: Pick<OrganizationMemberRecord, "role" | "permissions">,
    ctx?: RequestContext,
  ): Promise<OrganizationMemberRecord | null>;
  setMembershipStatus(
    organizationId: string,
    memberUserId: string,
    status: OrganizationMemberRecord["status"],
    ctx?: RequestContext,
  ): Promise<OrganizationMemberRecord | null>;
  createInvitation(
    data: InsertOrganizationInvitation,
    ctx?: RequestContext,
  ): Promise<OrganizationInvitationRecord>;
  findInvitationByCodeHash(
    codeHash: string,
    ctx?: RequestContext,
  ): Promise<OrganizationInvitationRecord | null>;
  findInvitationById(
    invitationId: string,
    ctx?: RequestContext,
  ): Promise<OrganizationInvitationRecord | null>;
  findPendingInvitationById(
    organizationId: string,
    invitationId: string,
    ctx?: RequestContext,
  ): Promise<OrganizationInvitationRecord | null>;
  listInvitationsByOrganizationId(
    organizationId: string,
    includeHistory: boolean,
    ctx?: RequestContext,
  ): Promise<OrganizationInvitationListItem[]>;
  updateInvitationStatus(
    invitationId: string,
    status: OrganizationInvitationStatus,
    data?: Partial<
      Pick<
        OrganizationInvitationRecord,
        | "acceptedAt"
        | "acceptedByUserId"
        | "updatedAt"
        | "cooldownUntil"
        | "failedAttemptCount"
      >
    >,
    ctx?: RequestContext,
  ): Promise<OrganizationInvitationRecord | null>;
  incrementInvitationFailedAttempts(
    invitationId: string,
    cooldownUntil: Date | null,
    ctx?: RequestContext,
  ): Promise<OrganizationInvitationRecord | null>;
}

export class OrganizationMemberRepository
  implements IOrganizationMemberRepository
{
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findActiveMembership(
    organizationId: string,
    userId: string,
    ctx?: RequestContext,
  ): Promise<OrganizationMemberRecord | null> {
    const client = this.getClient(ctx);
    const rows = await client
      .select()
      .from(organizationMember)
      .where(
        and(
          eq(organizationMember.organizationId, organizationId),
          eq(organizationMember.userId, userId),
          eq(organizationMember.status, "ACTIVE"),
        ),
      )
      .limit(1);

    return rows[0] ?? null;
  }

  async listActiveByOrganizationId(
    organizationId: string,
    ctx?: RequestContext,
  ): Promise<OrganizationMemberListItem[]> {
    const client = this.getClient(ctx);
    const rows = await client
      .select({
        member: organizationMember,
        displayName: profile.displayName,
        email: profile.email,
        avatarUrl: profile.avatarUrl,
      })
      .from(organizationMember)
      .leftJoin(profile, eq(profile.userId, organizationMember.userId))
      .where(
        and(
          eq(organizationMember.organizationId, organizationId),
          eq(organizationMember.status, "ACTIVE"),
        ),
      )
      .orderBy(desc(organizationMember.createdAt));

    return rows;
  }

  async listActiveUserIdsByOrganizationPermission(
    organizationId: string,
    permission: OrganizationMemberPermission,
    ctx?: RequestContext,
  ): Promise<string[]> {
    const client = this.getClient(ctx);
    const rows = await client
      .select({ userId: organizationMember.userId })
      .from(organizationMember)
      .where(
        and(
          eq(organizationMember.organizationId, organizationId),
          eq(organizationMember.status, "ACTIVE"),
          sql`${organizationMember.permissions} ? ${permission}`,
        ),
      );

    return rows.map((row) => row.userId);
  }

  async listAccessibleOrganizationIdsByPermission(
    userId: string,
    permission: OrganizationMemberPermission,
    organizationIds: string[],
    ctx?: RequestContext,
  ): Promise<string[]> {
    if (organizationIds.length === 0) return [];

    const client = this.getClient(ctx);
    const rows = await client
      .select({ organizationId: organizationMember.organizationId })
      .from(organizationMember)
      .where(
        and(
          eq(organizationMember.userId, userId),
          eq(organizationMember.status, "ACTIVE"),
          inArray(organizationMember.organizationId, organizationIds),
          sql`${organizationMember.permissions} ? ${permission}`,
        ),
      );

    return rows.map((row) => row.organizationId);
  }

  async findReservationNotificationPreference(
    organizationId: string,
    userId: string,
    ctx?: RequestContext,
  ): Promise<OrganizationMemberNotificationPreferenceRecord | null> {
    const client = this.getClient(ctx);
    const rows = await client
      .select()
      .from(organizationMemberNotificationPreference)
      .where(
        and(
          eq(
            organizationMemberNotificationPreference.organizationId,
            organizationId,
          ),
          eq(organizationMemberNotificationPreference.userId, userId),
        ),
      )
      .limit(1);

    return rows[0] ?? null;
  }

  async upsertReservationNotificationPreference(
    data: InsertOrganizationMemberNotificationPreference,
    ctx?: RequestContext,
  ): Promise<OrganizationMemberNotificationPreferenceRecord> {
    const client = this.getClient(ctx);
    const rows = await client
      .insert(organizationMemberNotificationPreference)
      .values(data)
      .onConflictDoUpdate({
        target: [
          organizationMemberNotificationPreference.organizationId,
          organizationMemberNotificationPreference.userId,
        ],
        set: {
          reservationOpsEnabled: data.reservationOpsEnabled ?? false,
          updatedAt: new Date(),
        },
      })
      .returning();

    return rows[0];
  }

  async listReservationNotificationEnabledUserIds(
    organizationId: string,
    userIds: string[],
    ctx?: RequestContext,
  ): Promise<string[]> {
    if (userIds.length === 0) return [];

    const client = this.getClient(ctx);
    const rows = await client
      .select({ userId: organizationMemberNotificationPreference.userId })
      .from(organizationMemberNotificationPreference)
      .where(
        and(
          eq(
            organizationMemberNotificationPreference.organizationId,
            organizationId,
          ),
          inArray(organizationMemberNotificationPreference.userId, userIds),
          eq(
            organizationMemberNotificationPreference.reservationOpsEnabled,
            true,
          ),
        ),
      );

    return rows.map((row) => row.userId);
  }

  async upsertActiveMembership(
    data: InsertOrganizationMember,
    ctx?: RequestContext,
  ): Promise<OrganizationMemberRecord> {
    const client = this.getClient(ctx);
    const rows = await client
      .insert(organizationMember)
      .values(data)
      .onConflictDoUpdate({
        target: [organizationMember.organizationId, organizationMember.userId],
        set: {
          role: data.role,
          permissions: data.permissions,
          status: "ACTIVE",
          invitedByUserId: data.invitedByUserId ?? null,
          joinedAt: data.joinedAt ?? new Date(),
          updatedAt: new Date(),
        },
      })
      .returning();

    return rows[0];
  }

  async updateMembershipRolePermissions(
    organizationId: string,
    memberUserId: string,
    data: Pick<OrganizationMemberRecord, "role" | "permissions">,
    ctx?: RequestContext,
  ): Promise<OrganizationMemberRecord | null> {
    const client = this.getClient(ctx);
    const rows = await client
      .update(organizationMember)
      .set({
        role: data.role,
        permissions: data.permissions,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(organizationMember.organizationId, organizationId),
          eq(organizationMember.userId, memberUserId),
          eq(organizationMember.status, "ACTIVE"),
        ),
      )
      .returning();

    return rows[0] ?? null;
  }

  async setMembershipStatus(
    organizationId: string,
    memberUserId: string,
    status: OrganizationMemberRecord["status"],
    ctx?: RequestContext,
  ): Promise<OrganizationMemberRecord | null> {
    const client = this.getClient(ctx);
    const rows = await client
      .update(organizationMember)
      .set({ status, updatedAt: new Date() })
      .where(
        and(
          eq(organizationMember.organizationId, organizationId),
          eq(organizationMember.userId, memberUserId),
        ),
      )
      .returning();

    return rows[0] ?? null;
  }

  async createInvitation(
    data: InsertOrganizationInvitation,
    ctx?: RequestContext,
  ): Promise<OrganizationInvitationRecord> {
    const client = this.getClient(ctx);
    const rows = await client
      .insert(organizationInvitation)
      .values(data)
      .returning();

    return rows[0];
  }

  async findInvitationByCodeHash(
    codeHash: string,
    ctx?: RequestContext,
  ): Promise<OrganizationInvitationRecord | null> {
    const client = this.getClient(ctx);
    const rows = await client
      .select()
      .from(organizationInvitation)
      .where(eq(organizationInvitation.tokenHash, codeHash))
      .limit(1);

    return rows[0] ?? null;
  }

  async findInvitationById(
    invitationId: string,
    ctx?: RequestContext,
  ): Promise<OrganizationInvitationRecord | null> {
    const client = this.getClient(ctx);
    const rows = await client
      .select()
      .from(organizationInvitation)
      .where(eq(organizationInvitation.id, invitationId))
      .limit(1);

    return rows[0] ?? null;
  }

  async findPendingInvitationById(
    organizationId: string,
    invitationId: string,
    ctx?: RequestContext,
  ): Promise<OrganizationInvitationRecord | null> {
    const client = this.getClient(ctx);
    const rows = await client
      .select()
      .from(organizationInvitation)
      .where(
        and(
          eq(organizationInvitation.organizationId, organizationId),
          eq(organizationInvitation.id, invitationId),
          eq(organizationInvitation.status, "PENDING"),
        ),
      )
      .limit(1);

    return rows[0] ?? null;
  }

  async listInvitationsByOrganizationId(
    organizationId: string,
    includeHistory: boolean,
    ctx?: RequestContext,
  ): Promise<OrganizationInvitationListItem[]> {
    const client = this.getClient(ctx);

    const rows = includeHistory
      ? await client
          .select({ invitation: organizationInvitation })
          .from(organizationInvitation)
          .where(eq(organizationInvitation.organizationId, organizationId))
          .orderBy(desc(organizationInvitation.createdAt))
      : await client
          .select({ invitation: organizationInvitation })
          .from(organizationInvitation)
          .where(
            and(
              eq(organizationInvitation.organizationId, organizationId),
              eq(organizationInvitation.status, "PENDING"),
            ),
          )
          .orderBy(desc(organizationInvitation.createdAt));

    return rows;
  }

  async updateInvitationStatus(
    invitationId: string,
    status: OrganizationInvitationStatus,
    data?: Partial<
      Pick<
        OrganizationInvitationRecord,
        | "acceptedAt"
        | "acceptedByUserId"
        | "updatedAt"
        | "cooldownUntil"
        | "failedAttemptCount"
      >
    >,
    ctx?: RequestContext,
  ): Promise<OrganizationInvitationRecord | null> {
    const client = this.getClient(ctx);
    const rows = await client
      .update(organizationInvitation)
      .set({
        status,
        acceptedAt: data?.acceptedAt,
        acceptedByUserId: data?.acceptedByUserId,
        cooldownUntil: data?.cooldownUntil,
        failedAttemptCount: data?.failedAttemptCount,
        updatedAt: data?.updatedAt ?? new Date(),
      })
      .where(eq(organizationInvitation.id, invitationId))
      .returning();

    return rows[0] ?? null;
  }

  async incrementInvitationFailedAttempts(
    invitationId: string,
    cooldownUntil: Date | null,
    ctx?: RequestContext,
  ): Promise<OrganizationInvitationRecord | null> {
    const client = this.getClient(ctx);
    const rows = await client
      .update(organizationInvitation)
      .set({
        failedAttemptCount: sql`${organizationInvitation.failedAttemptCount} + 1`,
        cooldownUntil,
        updatedAt: new Date(),
      })
      .where(eq(organizationInvitation.id, invitationId))
      .returning();

    return rows[0] ?? null;
  }
}
