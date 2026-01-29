import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import { organization } from "./organization";

/**
 * Guest Profile table
 * Reusable guest identity scoped to an organization (non-registered person)
 */
export const guestProfile = pgTable(
  "guest_profile",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "restrict" }),
    displayName: varchar("display_name", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }),
    phoneNumber: varchar("phone_number", { length: 20 }),
    notes: text("notes"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("idx_guest_profile_org").on(table.organizationId)],
);

export const GuestProfileSchema = createSelectSchema(guestProfile);
export const InsertGuestProfileSchema = createInsertSchema(guestProfile);

export type GuestProfileRecord = z.infer<typeof GuestProfileSchema>;
export type InsertGuestProfile = z.infer<typeof InsertGuestProfileSchema>;
