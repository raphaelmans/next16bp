import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * Profile table
 * Links Supabase auth.users to player-specific data
 */
export const profile = pgTable(
  "profile",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    displayName: varchar("display_name", { length: 100 }),
    email: varchar("email", { length: 255 }),
    phoneNumber: varchar("phone_number", { length: 20 }),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("idx_profile_user").on(table.userId)],
);

export const ProfileSchema = createSelectSchema(profile);
export const InsertProfileSchema = createInsertSchema(profile);

export type ProfileRecord = z.infer<typeof ProfileSchema>;
export type InsertProfile = z.infer<typeof InsertProfileSchema>;
