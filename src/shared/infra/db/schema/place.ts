import { sql } from "drizzle-orm";
import {
  boolean,
  decimal,
  index,
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
    province: varchar("province", { length: 100 }).notNull(),
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
 * Place Contact Detail table
 * Contact details for curated and reservable places.
 */
export const placeContactDetail = pgTable("place_contact_detail", {
  id: uuid("id").primaryKey().defaultRandom(),
  placeId: uuid("place_id")
    .notNull()
    .unique()
    .references(() => place.id, { onDelete: "cascade" }),
  facebookUrl: text("facebook_url"),
  phoneNumber: varchar("phone_number", { length: 20 }),
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

export const PlaceContactDetailSchema = createSelectSchema(placeContactDetail);
export const InsertPlaceContactDetailSchema =
  createInsertSchema(placeContactDetail);

export type PlaceContactDetailRecord = z.infer<typeof PlaceContactDetailSchema>;
export type InsertPlaceContactDetail = z.infer<
  typeof InsertPlaceContactDetailSchema
>;
