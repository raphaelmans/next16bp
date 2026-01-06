import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * Organization table
 * Represents a court owner/operator entity (tenant)
 */
export const organization = pgTable(
  "organization",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerUserId: uuid("owner_user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 150 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("idx_organization_slug").on(table.slug)],
);

export const OrganizationSchema = createSelectSchema(organization);
export const InsertOrganizationSchema = createInsertSchema(organization);

export type OrganizationRecord = z.infer<typeof OrganizationSchema>;
export type InsertOrganization = z.infer<typeof InsertOrganizationSchema>;

/**
 * Organization Profile table
 * Extended profile information for organizations (1:1 with organization)
 */
export const organizationProfile = pgTable("organization_profile", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .unique()
    .references(() => organization.id, { onDelete: "cascade" }),
  description: text("description"),
  logoUrl: text("logo_url"),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 20 }),
  address: text("address"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const OrganizationProfileSchema =
  createSelectSchema(organizationProfile);
export const InsertOrganizationProfileSchema =
  createInsertSchema(organizationProfile);

export type OrganizationProfileRecord = z.infer<
  typeof OrganizationProfileSchema
>;
export type InsertOrganizationProfile = z.infer<
  typeof InsertOrganizationProfileSchema
>;
