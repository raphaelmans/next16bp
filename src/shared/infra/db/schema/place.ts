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
import { placeClaimStatusEnum, placeTypeEnum } from "./enums";
import { organization } from "./organization";

/**
 * Place table (Base Listing Entity)
 * Physical venue listing with discovery metadata.
 */
export const place = pgTable(
  "place",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").references(() => organization.id, {
      onDelete: "set null",
    }),
    name: varchar("name", { length: 200 }).notNull(),
    address: text("address").notNull(),
    city: varchar("city", { length: 100 }).notNull(),
    province: varchar("province", { length: 100 }),
    country: varchar("country", { length: 2 }).notNull().default("PH"),
    latitude: decimal("latitude", { precision: 10, scale: 8 }),
    longitude: decimal("longitude", { precision: 11, scale: 8 }),
    timeZone: varchar("time_zone", { length: 64 })
      .notNull()
      .default("Asia/Manila"),
    placeType: placeTypeEnum("place_type").notNull(),
    claimStatus: placeClaimStatusEnum("claim_status")
      .notNull()
      .default("UNCLAIMED"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_place_location").on(table.latitude, table.longitude),
    index("idx_place_city").on(table.city),
    index("idx_place_type").on(table.placeType),
    index("idx_place_org")
      .on(table.organizationId)
      .where(sql`${table.organizationId} IS NOT NULL`),
    index("idx_place_active")
      .on(table.isActive)
      .where(sql`${table.isActive} = true`),
  ],
);

export const PlaceSchema = createSelectSchema(place);
export const InsertPlaceSchema = createInsertSchema(place);

export type PlaceRecord = z.infer<typeof PlaceSchema>;
export type InsertPlace = z.infer<typeof InsertPlaceSchema>;

/**
 * Curated Place Detail table (Subclass)
 * Additional details for manually curated (view-only) places.
 */
export const curatedPlaceDetail = pgTable("curated_place_detail", {
  id: uuid("id").primaryKey().defaultRandom(),
  placeId: uuid("place_id")
    .notNull()
    .unique()
    .references(() => place.id, { onDelete: "cascade" }),
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

export const CuratedPlaceDetailSchema = createSelectSchema(curatedPlaceDetail);
export const InsertCuratedPlaceDetailSchema =
  createInsertSchema(curatedPlaceDetail);

export type CuratedPlaceDetailRecord = z.infer<typeof CuratedPlaceDetailSchema>;
export type InsertCuratedPlaceDetail = z.infer<
  typeof InsertCuratedPlaceDetailSchema
>;

/**
 * Reservable Place Policy table (Subclass)
 * Place-wide payment + policy configuration.
 */
export const reservablePlacePolicy = pgTable("reservable_place_policy", {
  id: uuid("id").primaryKey().defaultRandom(),
  placeId: uuid("place_id")
    .notNull()
    .unique()
    .references(() => place.id, { onDelete: "cascade" }),
  requiresOwnerConfirmation: boolean("requires_owner_confirmation")
    .notNull()
    .default(true),
  paymentHoldMinutes: integer("payment_hold_minutes").notNull().default(15),
  ownerReviewMinutes: integer("owner_review_minutes").notNull().default(15),
  cancellationCutoffMinutes: integer("cancellation_cutoff_minutes")
    .notNull()
    .default(0),
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

export const ReservablePlacePolicySchema = createSelectSchema(
  reservablePlacePolicy,
);
export const InsertReservablePlacePolicySchema = createInsertSchema(
  reservablePlacePolicy,
);

export type ReservablePlacePolicyRecord = z.infer<
  typeof ReservablePlacePolicySchema
>;
export type InsertReservablePlacePolicy = z.infer<
  typeof InsertReservablePlacePolicySchema
>;
