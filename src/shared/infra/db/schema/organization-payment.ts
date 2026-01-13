import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import { paymentMethodProviderEnum, paymentMethodTypeEnum } from "./enums";
import { organization } from "./organization";

/**
 * Organization Reservation Policy table
 * Stores organization-wide reservation defaults (TTL, cancellation rules)
 */
export const organizationReservationPolicy = pgTable(
  "organization_reservation_policy",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" })
      .unique(),
    requiresOwnerConfirmation: boolean("requires_owner_confirmation")
      .notNull()
      .default(true),
    paymentHoldMinutes: integer("payment_hold_minutes").notNull().default(15),
    ownerReviewMinutes: integer("owner_review_minutes").notNull().default(15),
    cancellationCutoffMinutes: integer("cancellation_cutoff_minutes")
      .notNull()
      .default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
);

export const OrganizationReservationPolicySchema = createSelectSchema(
  organizationReservationPolicy,
);
export const InsertOrganizationReservationPolicySchema = createInsertSchema(
  organizationReservationPolicy,
);

export type OrganizationReservationPolicyRecord = z.infer<
  typeof OrganizationReservationPolicySchema
>;
export type InsertOrganizationReservationPolicy = z.infer<
  typeof InsertOrganizationReservationPolicySchema
>;

/**
 * Organization Payment Method table
 * Stores payment accounts for P2P payments (wallet/bank)
 */
export const organizationPaymentMethod = pgTable(
  "organization_payment_method",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    type: paymentMethodTypeEnum("type").notNull(),
    provider: paymentMethodProviderEnum("provider").notNull(),
    accountName: varchar("account_name", { length: 150 }).notNull(),
    accountNumber: varchar("account_number", { length: 50 }).notNull(),
    instructions: text("instructions"),
    isActive: boolean("is_active").notNull().default(true),
    isDefault: boolean("is_default").notNull().default(false),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("idx_org_payment_method_unique").on(
      table.organizationId,
      table.provider,
      table.accountNumber,
    ),
    uniqueIndex("idx_org_payment_method_default")
      .on(table.organizationId)
      .where(sql`${table.isDefault} = true`),
  ],
);

export const OrganizationPaymentMethodSchema = createSelectSchema(
  organizationPaymentMethod,
);
export const InsertOrganizationPaymentMethodSchema = createInsertSchema(
  organizationPaymentMethod,
);

export type OrganizationPaymentMethodRecord = z.infer<
  typeof OrganizationPaymentMethodSchema
>;
export type InsertOrganizationPaymentMethod = z.infer<
  typeof InsertOrganizationPaymentMethodSchema
>;
