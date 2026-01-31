import { index, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import { defaultPortalEnum } from "./enums";

/**
 * User preferences table
 * Stores per-user settings such as default portal
 */
export const userPreferences = pgTable(
  "user_preferences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    defaultPortal: defaultPortalEnum("default_portal")
      .notNull()
      .default("player"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("idx_user_preferences_user").on(table.userId)],
);

export const UserPreferenceSchema = createSelectSchema(userPreferences);
export const InsertUserPreferenceSchema = createInsertSchema(userPreferences);

export type UserPreferenceRecord = z.infer<typeof UserPreferenceSchema>;
export type InsertUserPreference = z.infer<typeof InsertUserPreferenceSchema>;
