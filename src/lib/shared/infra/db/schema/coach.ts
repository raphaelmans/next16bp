import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  decimal,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import { coachVerificationStatusEnum } from "./enums";
import { profile } from "./profile";

/**
 * Coach table
 * First-class coach entity linked 1:1 to a real user and profile.
 */
export const coach = pgTable(
  "coach",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    profileId: uuid("profile_id")
      .notNull()
      .unique()
      .references(() => profile.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 200 }).notNull(),
    tagline: varchar("tagline", { length: 300 }),
    bio: text("bio"),
    introVideoUrl: text("intro_video_url"),
    yearsOfExperience: integer("years_of_experience"),
    playingBackground: text("playing_background"),
    coachingPhilosophy: text("coaching_philosophy"),
    city: varchar("city", { length: 100 }),
    province: varchar("province", { length: 100 }),
    country: varchar("country", { length: 2 }).notNull().default("PH"),
    latitude: decimal("latitude", { precision: 10, scale: 8 }),
    longitude: decimal("longitude", { precision: 11, scale: 8 }),
    timeZone: varchar("time_zone", { length: 64 })
      .notNull()
      .default("Asia/Manila"),
    willingToTravel: boolean("willing_to_travel").notNull().default(false),
    onlineCoaching: boolean("online_coaching").notNull().default(false),
    baseHourlyRateCents: integer("base_hourly_rate_cents"),
    baseHourlyRateCurrency: varchar("base_hourly_rate_currency", {
      length: 3,
    })
      .notNull()
      .default("PHP"),
    verificationStatus: coachVerificationStatusEnum("verification_status")
      .notNull()
      .default("UNVERIFIED"),
    verificationSubmittedAt: timestamp("verification_submitted_at", {
      withTimezone: true,
    }),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(true),
    featuredRank: integer("featured_rank").notNull().default(0),
    provinceRank: integer("province_rank").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_coach_location").on(table.latitude, table.longitude),
    index("idx_coach_city").on(table.city),
    index("idx_coach_province").on(table.province),
    index("idx_coach_name_trgm").using("gin", sql`${table.name} gin_trgm_ops`),
    uniqueIndex("uq_coach_slug").on(table.slug),
    index("idx_coach_active")
      .on(table.isActive)
      .where(sql`${table.isActive} = true`),
    uniqueIndex("idx_coach_featured_rank_unique")
      .on(table.featuredRank)
      .where(sql`${table.featuredRank} > 0`),
    uniqueIndex("idx_coach_province_rank_per_province_unique")
      .on(table.province, table.provinceRank)
      .where(sql`${table.provinceRank} > 0`),
    check(
      "coach_years_of_experience_non_negative",
      sql`${table.yearsOfExperience} IS NULL OR ${table.yearsOfExperience} >= 0`,
    ),
    check(
      "coach_base_hourly_rate_non_negative",
      sql`${table.baseHourlyRateCents} IS NULL OR ${table.baseHourlyRateCents} >= 0`,
    ),
  ],
);

export const CoachSchema = createSelectSchema(coach);
export const InsertCoachSchema = createInsertSchema(coach);

export type CoachRecord = z.infer<typeof CoachSchema>;
export type InsertCoach = z.infer<typeof InsertCoachSchema>;

/**
 * Coach Contact Detail table
 * Contact details for a coach profile.
 */
export const coachContactDetail = pgTable("coach_contact_detail", {
  id: uuid("id").primaryKey().defaultRandom(),
  coachId: uuid("coach_id")
    .notNull()
    .unique()
    .references(() => coach.id, { onDelete: "cascade" }),
  phoneNumber: varchar("phone_number", { length: 20 }),
  facebookUrl: text("facebook_url"),
  instagramUrl: text("instagram_url"),
  websiteUrl: text("website_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const CoachContactDetailSchema = createSelectSchema(coachContactDetail);
export const InsertCoachContactDetailSchema =
  createInsertSchema(coachContactDetail);

export type CoachContactDetailRecord = z.infer<typeof CoachContactDetailSchema>;
export type InsertCoachContactDetail = z.infer<
  typeof InsertCoachContactDetailSchema
>;
