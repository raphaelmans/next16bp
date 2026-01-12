import { index, integer, pgTable, unique, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import { reservation } from "./reservation";
import { timeSlot } from "./time-slot";

/**
 * Reservation Time Slot table
 * Join table linking reservations to multiple slots.
 */
export const reservationTimeSlot = pgTable(
  "reservation_time_slot",
  {
    reservationId: uuid("reservation_id")
      .notNull()
      .references(() => reservation.id, { onDelete: "cascade" }),
    timeSlotId: uuid("time_slot_id")
      .notNull()
      .references(() => timeSlot.id, { onDelete: "cascade" }),
    sequence: integer("sequence").notNull(),
  },
  (table) => [
    unique("reservation_time_slot_reservation_sequence_unique").on(
      table.reservationId,
      table.sequence,
    ),
    unique("reservation_time_slot_reservation_time_slot_unique").on(
      table.reservationId,
      table.timeSlotId,
    ),
    index("idx_reservation_time_slot_reservation").on(table.reservationId),
    index("idx_reservation_time_slot_slot").on(table.timeSlotId),
  ],
);

export const ReservationTimeSlotSchema =
  createSelectSchema(reservationTimeSlot);
export const InsertReservationTimeSlotSchema =
  createInsertSchema(reservationTimeSlot);

export type ReservationTimeSlotRecord = z.infer<
  typeof ReservationTimeSlotSchema
>;
export type InsertReservationTimeSlot = z.infer<
  typeof InsertReservationTimeSlotSchema
>;
