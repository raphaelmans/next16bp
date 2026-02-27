import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import {
  organizationInvitationStatusEnum,
  organizationMemberRoleEnum,
  organizationMemberStatusEnum,
} from "./enums";
import { organization } from "./organization";

/**
 * Organization member table.
 * Stores invited member access to organization operations.
 */
export const organizationMember = pgTable(
  "organization_member",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    role: organizationMemberRoleEnum("role").notNull(),
    permissions: jsonb("permissions").$type<string[]>().notNull(),
    status: organizationMemberStatusEnum("status").notNull().default("ACTIVE"),
    invitedByUserId: uuid("invited_by_user_id").references(() => authUsers.id, {
      onDelete: "set null",
    }),
    joinedAt: timestamp("joined_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_organization_member_org_user").on(
      table.organizationId,
      table.userId,
    ),
    index("idx_organization_member_org_status").on(
      table.organizationId,
      table.status,
    ),
    index("idx_organization_member_user_status").on(table.userId, table.status),
  ],
);

/**
 * Organization invitation table.
 * Tracks email invitations before membership activation.
 */
export const organizationInvitation = pgTable(
  "organization_invitation",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    role: organizationMemberRoleEnum("role").notNull(),
    permissions: jsonb("permissions").$type<string[]>().notNull(),
    tokenHash: varchar("token_hash", { length: 128 }).notNull(),
    status: organizationInvitationStatusEnum("status")
      .notNull()
      .default("PENDING"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    invitedByUserId: uuid("invited_by_user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    acceptedByUserId: uuid("accepted_by_user_id").references(
      () => authUsers.id,
      {
        onDelete: "set null",
      },
    ),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_organization_invitation_token_hash").on(table.tokenHash),
    uniqueIndex("uq_organization_invitation_pending_org_email")
      .on(table.organizationId, table.email)
      .where(sql`${table.status} = 'PENDING'`),
    index("idx_organization_invitation_org_status").on(
      table.organizationId,
      table.status,
    ),
    index("idx_organization_invitation_expires_at").on(table.expiresAt),
  ],
);

export const OrganizationMemberSchema = createSelectSchema(organizationMember);
export const InsertOrganizationMemberSchema =
  createInsertSchema(organizationMember);
export const OrganizationInvitationSchema = createSelectSchema(
  organizationInvitation,
);
export const InsertOrganizationInvitationSchema = createInsertSchema(
  organizationInvitation,
);

/**
 * Organization member notification preferences table.
 * Stores per-user, per-organization opt-in toggles for reservation operations notifications.
 */
export const organizationMemberNotificationPreference = pgTable(
  "organization_member_notification_preference",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    reservationOpsEnabled: boolean("reservation_ops_enabled")
      .notNull()
      .default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_org_member_notification_pref_org_user").on(
      table.organizationId,
      table.userId,
    ),
    index("idx_org_member_notification_pref_org_enabled").on(
      table.organizationId,
      table.reservationOpsEnabled,
    ),
    index("idx_org_member_notification_pref_user").on(table.userId),
  ],
);

export const OrganizationMemberNotificationPreferenceSchema =
  createSelectSchema(organizationMemberNotificationPreference);
export const InsertOrganizationMemberNotificationPreferenceSchema =
  createInsertSchema(organizationMemberNotificationPreference);

export type OrganizationMemberRecord = z.infer<typeof OrganizationMemberSchema>;
export type InsertOrganizationMember = z.infer<
  typeof InsertOrganizationMemberSchema
>;
export type OrganizationInvitationRecord = z.infer<
  typeof OrganizationInvitationSchema
>;
export type InsertOrganizationInvitation = z.infer<
  typeof InsertOrganizationInvitationSchema
>;
export type OrganizationMemberNotificationPreferenceRecord = z.infer<
  typeof OrganizationMemberNotificationPreferenceSchema
>;
export type InsertOrganizationMemberNotificationPreference = z.infer<
  typeof InsertOrganizationMemberNotificationPreferenceSchema
>;
