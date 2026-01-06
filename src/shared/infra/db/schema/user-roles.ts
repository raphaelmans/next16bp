import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * User roles table
 * Links Supabase auth.users to application roles
 */
export const userRoles = pgTable("user_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("member"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Re-export authUsers for convenience
export { authUsers };
export type AuthUser = typeof authUsers.$inferSelect;

export const UserRoleSchema = createSelectSchema(userRoles);
export const InsertUserRoleSchema = createInsertSchema(userRoles);

export type UserRoleRecord = z.infer<typeof UserRoleSchema>;
export type InsertUserRole = z.infer<typeof InsertUserRoleSchema>;
