import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";

/**
 * Contact message table
 * Stores public contact inquiries and email delivery metadata.
 */
export const contactMessage = pgTable(
  "contact_message",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 150 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    subject: varchar("subject", { length: 200 }).notNull(),
    message: text("message").notNull(),
    userId: uuid("user_id").references(() => authUsers.id, {
      onDelete: "set null",
    }),
    requestId: varchar("request_id", { length: 64 }),
    resendEmailId: varchar("resend_email_id", { length: 100 }),
    emailSentAt: timestamp("email_sent_at", { withTimezone: true }),
    emailFailedAt: timestamp("email_failed_at", { withTimezone: true }),
    emailError: text("email_error"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_contact_message_email").on(table.email),
    index("idx_contact_message_user").on(table.userId),
    index("idx_contact_message_created").on(table.createdAt),
  ],
);

export const ContactMessageSchema = createSelectSchema(contactMessage);
export const InsertContactMessageSchema = createInsertSchema(contactMessage);

export type ContactMessageRecord = z.infer<typeof ContactMessageSchema>;
export type InsertContactMessage = z.infer<typeof InsertContactMessageSchema>;
