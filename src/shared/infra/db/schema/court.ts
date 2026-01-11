import { sql } from "drizzle-orm";
import {
  boolean,
  decimal,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import { claimStatusEnum, courtTypeEnum } from "./enums";
import { organization } from "./organization";

/**
 * Court table (Base Entity)
 * Core court information shared across all court types
 */
export const court = pgTable(
  "court",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").references(() => organization.id, {
      onDelete: "set null",
    }),
    name: varchar("name", { length: 200 }).notNull(),
    address: text("address").notNull(),
    city: varchar("city", { length: 100 }).notNull(),
    latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
    longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
    courtType: courtTypeEnum("court_type").notNull(),
    claimStatus: claimStatusEnum("claim_status").notNull().default("UNCLAIMED"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_court_location").on(table.latitude, table.longitude),
    index("idx_court_city").on(table.city),
    index("idx_court_type").on(table.courtType),
    index("idx_court_org")
      .on(table.organizationId)
      .where(sql`${table.organizationId} IS NOT NULL`),
    index("idx_court_active")
      .on(table.isActive)
      .where(sql`${table.isActive} = true`),
  ],
);

export const CourtSchema = createSelectSchema(court);
export const InsertCourtSchema = createInsertSchema(court);

export type CourtRecord = z.infer<typeof CourtSchema>;
export type InsertCourt = z.infer<typeof InsertCourtSchema>;

/**
 * Curated Court Detail table (Subclass)
 * Additional details for manually curated (view-only) courts
 */
export const curatedCourtDetail = pgTable("curated_court_detail", {
  id: uuid("id").primaryKey().defaultRandom(),
  courtId: uuid("court_id")
    .notNull()
    .unique()
    .references(() => court.id, { onDelete: "cascade" }),
  facebookUrl: text("facebook_url"),
  viberInfo: varchar("viber_info", { length: 100 }),
  instagramUrl: text("instagram_url"),
  websiteUrl: text("website_url"),
  otherContactInfo: text("other_contact_info"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const CuratedCourtDetailSchema = createSelectSchema(curatedCourtDetail);
export const InsertCuratedCourtDetailSchema =
  createInsertSchema(curatedCourtDetail);

export type CuratedCourtDetailRecord = z.infer<typeof CuratedCourtDetailSchema>;
export type InsertCuratedCourtDetail = z.infer<
  typeof InsertCuratedCourtDetailSchema
>;

/**
 * Reservable Court Detail table (Subclass)
 * Additional details for courts with reservation capability
 */
export const reservableCourtDetail = pgTable("reservable_court_detail", {
  id: uuid("id").primaryKey().defaultRandom(),
  courtId: uuid("court_id")
    .notNull()
    .unique()
    .references(() => court.id, { onDelete: "cascade" }),
  isFree: boolean("is_free").notNull().default(false),
  defaultCurrency: varchar("default_currency", { length: 3 })
    .notNull()
    .default("PHP"),
  defaultPriceCents: integer("default_price_cents"),
  paymentInstructions: text("payment_instructions"),
  gcashNumber: varchar("gcash_number", { length: 20 }),
  bankName: varchar("bank_name", { length: 100 }),
  bankAccountNumber: varchar("bank_account_number", { length: 50 }),
  bankAccountName: varchar("bank_account_name", { length: 150 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const ReservableCourtDetailSchema = createSelectSchema(
  reservableCourtDetail,
);
export const InsertReservableCourtDetailSchema = createInsertSchema(
  reservableCourtDetail,
);

export type ReservableCourtDetailRecord = z.infer<
  typeof ReservableCourtDetailSchema
>;
export type InsertReservableCourtDetail = z.infer<
  typeof InsertReservableCourtDetailSchema
>;
