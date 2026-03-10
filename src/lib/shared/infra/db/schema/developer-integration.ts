import { sql } from "drizzle-orm";
import {
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
import { court } from "./court";
import { courtBlock } from "./court-block";
import { organization } from "./organization";

export const developerIntegration = pgTable(
  "developer_integration",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 160 }).notNull(),
    status: varchar("status", { length: 32 }).notNull().default("ACTIVE"),
    createdByUserId: uuid("created_by_user_id").references(() => authUsers.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_developer_integration_org_status").on(
      table.organizationId,
      table.status,
    ),
  ],
);

export const developerApiKey = pgTable(
  "developer_api_key",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    integrationId: uuid("integration_id")
      .notNull()
      .references(() => developerIntegration.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 160 }).notNull(),
    keyPrefix: varchar("key_prefix", { length: 64 }).notNull(),
    secretHash: varchar("secret_hash", { length: 64 }).notNull(),
    lastFour: varchar("last_four", { length: 4 }).notNull(),
    scopes: jsonb("scopes")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    allowedIpCidrs: jsonb("allowed_ip_cidrs")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    status: varchar("status", { length: 32 }).notNull().default("ACTIVE"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    lastUsedIp: varchar("last_used_ip", { length: 64 }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_developer_api_key_prefix").on(table.keyPrefix),
    uniqueIndex("uq_developer_api_key_secret_hash").on(table.secretHash),
    index("idx_developer_api_key_integration_status").on(
      table.integrationId,
      table.status,
    ),
  ],
);

export const developerCourtMapping = pgTable(
  "developer_court_mapping",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    integrationId: uuid("integration_id")
      .notNull()
      .references(() => developerIntegration.id, { onDelete: "cascade" }),
    courtId: uuid("court_id")
      .notNull()
      .references(() => court.id, { onDelete: "cascade" }),
    externalCourtId: varchar("external_court_id", { length: 128 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_developer_court_mapping_external").on(
      table.integrationId,
      table.externalCourtId,
    ),
    uniqueIndex("uq_developer_court_mapping_court").on(
      table.integrationId,
      table.courtId,
    ),
  ],
);

export const developerUnavailabilitySync = pgTable(
  "developer_unavailability_sync",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    integrationId: uuid("integration_id")
      .notNull()
      .references(() => developerIntegration.id, { onDelete: "cascade" }),
    courtId: uuid("court_id")
      .notNull()
      .references(() => court.id, { onDelete: "cascade" }),
    courtBlockId: uuid("court_block_id").references(() => courtBlock.id, {
      onDelete: "set null",
    }),
    externalWindowId: varchar("external_window_id", { length: 128 }).notNull(),
    status: varchar("status", { length: 32 }).notNull().default("ACTIVE"),
    reason: varchar("reason", { length: 255 }),
    lastSyncedPayload: jsonb("last_synced_payload").$type<
      Record<string, unknown>
    >(),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_developer_unavailability_sync_external").on(
      table.integrationId,
      table.externalWindowId,
    ),
    uniqueIndex("uq_developer_unavailability_sync_block").on(
      table.courtBlockId,
    ),
    index("idx_developer_unavailability_sync_court_status").on(
      table.courtId,
      table.status,
    ),
  ],
);

export const DeveloperIntegrationSchema =
  createSelectSchema(developerIntegration);
export const InsertDeveloperIntegrationSchema =
  createInsertSchema(developerIntegration);
export const DeveloperApiKeySchema = createSelectSchema(developerApiKey);
export const InsertDeveloperApiKeySchema = createInsertSchema(developerApiKey);
export const DeveloperCourtMappingSchema = createSelectSchema(
  developerCourtMapping,
);
export const InsertDeveloperCourtMappingSchema = createInsertSchema(
  developerCourtMapping,
);
export const DeveloperUnavailabilitySyncSchema = createSelectSchema(
  developerUnavailabilitySync,
);
export const InsertDeveloperUnavailabilitySyncSchema = createInsertSchema(
  developerUnavailabilitySync,
);

export type DeveloperIntegrationRecord = z.infer<
  typeof DeveloperIntegrationSchema
>;
export type InsertDeveloperIntegration = z.infer<
  typeof InsertDeveloperIntegrationSchema
>;
export type DeveloperApiKeyRecord = z.infer<typeof DeveloperApiKeySchema>;
export type InsertDeveloperApiKey = z.infer<typeof InsertDeveloperApiKeySchema>;
export type DeveloperCourtMappingRecord = z.infer<
  typeof DeveloperCourtMappingSchema
>;
export type InsertDeveloperCourtMapping = z.infer<
  typeof InsertDeveloperCourtMappingSchema
>;
export type DeveloperUnavailabilitySyncRecord = z.infer<
  typeof DeveloperUnavailabilitySyncSchema
>;
export type InsertDeveloperUnavailabilitySync = z.infer<
  typeof InsertDeveloperUnavailabilitySyncSchema
>;
