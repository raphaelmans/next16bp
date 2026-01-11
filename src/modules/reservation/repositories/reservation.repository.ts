import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import {
  court,
  type InsertReservation,
  paymentProof,
  reservableCourtDetail,
  type ReservationRecord,
  reservation,
  timeSlot,
} from "@/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/shared/infra/db/types";
import type { RequestContext } from "@/shared/kernel/context";
import type { ReservationWithDetails } from "../dtos/reservation-owner.dto";

export interface IReservationRepository {
  findById(id: string, ctx?: RequestContext): Promise<ReservationRecord | null>;
  findByIdForUpdate(
    id: string,
    ctx: RequestContext,
  ): Promise<ReservationRecord | null>;
  findByPlayerId(
    playerId: string,
    pagination: { limit: number; offset: number },
    options?: {
      status?: string;
      upcoming?: boolean;
    },
    ctx?: RequestContext,
  ): Promise<ReservationRecord[]>;
  findByTimeSlotId(
    timeSlotId: string,
    ctx?: RequestContext,
  ): Promise<ReservationRecord[]>;
  findActiveByTimeSlotId(
    timeSlotId: string,
    ctx?: RequestContext,
  ): Promise<ReservationRecord | null>;
  countByOrganizationAndStatuses(
    organizationId: string,
    statuses: (
      | "CREATED"
      | "AWAITING_PAYMENT"
      | "PAYMENT_MARKED_BY_USER"
      | "CONFIRMED"
      | "EXPIRED"
      | "CANCELLED"
    )[],
    ctx?: RequestContext,
  ): Promise<number>;
  findWithDetailsByOrganization(
    organizationId: string,
    filters: {
      courtId?: string;
      status?: string;
      limit: number;
      offset: number;
    },
    ctx?: RequestContext,
  ): Promise<ReservationWithDetails[]>;
  create(
    data: InsertReservation,
    ctx?: RequestContext,
  ): Promise<ReservationRecord>;
  update(
    id: string,
    data: Partial<InsertReservation>,
    ctx?: RequestContext,
  ): Promise<ReservationRecord>;
}

export class ReservationRepository implements IReservationRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findById(
    id: string,
    ctx?: RequestContext,
  ): Promise<ReservationRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(reservation)
      .where(eq(reservation.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findByIdForUpdate(
    id: string,
    ctx: RequestContext,
  ): Promise<ReservationRecord | null> {
    const client = this.getClient(ctx) as DrizzleTransaction;
    const result = await client
      .select()
      .from(reservation)
      .where(eq(reservation.id, id))
      .for("update")
      .limit(1);
    return result[0] ?? null;
  }

  async findByPlayerId(
    playerId: string,
    pagination: { limit: number; offset: number },
    options?: {
      status?: string;
      upcoming?: boolean;
    },
    ctx?: RequestContext,
  ): Promise<ReservationRecord[]> {
    const client = this.getClient(ctx);

    // If upcoming filter is requested, we need to join with timeSlot
    if (options?.upcoming) {
      const conditions = [
        eq(reservation.playerId, playerId),
        // Only future reservations
        // We use a subquery approach since we need timeSlot.startTime
      ];

      if (options.status) {
        conditions.push(
          eq(
            reservation.status,
            options.status as
              | "CREATED"
              | "AWAITING_PAYMENT"
              | "PAYMENT_MARKED_BY_USER"
              | "CONFIRMED"
              | "EXPIRED"
              | "CANCELLED",
          ),
        );
      }

      // Join with timeSlot to filter by startTime
      const results = await client
        .select({
          reservation: reservation,
          startTime: timeSlot.startTime,
        })
        .from(reservation)
        .innerJoin(timeSlot, eq(reservation.timeSlotId, timeSlot.id))
        .where(and(...conditions))
        .orderBy(timeSlot.startTime)
        .limit(pagination.limit)
        .offset(pagination.offset);

      // Filter for future reservations and return just the reservation records
      const now = new Date();
      return results
        .filter((r) => new Date(r.startTime) > now)
        .map((r) => r.reservation);
    }

    // Standard query without upcoming filter
    const conditions = [eq(reservation.playerId, playerId)];

    if (options?.status) {
      conditions.push(
        eq(
          reservation.status,
          options.status as
            | "CREATED"
            | "AWAITING_PAYMENT"
            | "PAYMENT_MARKED_BY_USER"
            | "CONFIRMED"
            | "EXPIRED"
            | "CANCELLED",
        ),
      );
    }

    return client
      .select()
      .from(reservation)
      .where(and(...conditions))
      .orderBy(desc(reservation.createdAt))
      .limit(pagination.limit)
      .offset(pagination.offset);
  }

  async findByTimeSlotId(
    timeSlotId: string,
    ctx?: RequestContext,
  ): Promise<ReservationRecord[]> {
    const client = this.getClient(ctx);
    return client
      .select()
      .from(reservation)
      .where(eq(reservation.timeSlotId, timeSlotId));
  }

  async findActiveByTimeSlotId(
    timeSlotId: string,
    ctx?: RequestContext,
  ): Promise<ReservationRecord | null> {
    const client = this.getClient(ctx);
    // Find non-cancelled, non-expired reservations for this slot
    const results = await client
      .select()
      .from(reservation)
      .where(eq(reservation.timeSlotId, timeSlotId));

    // Filter to active reservations
    const active = results.find(
      (r) =>
        r.status !== "CANCELLED" &&
        r.status !== "EXPIRED" &&
        (r.status === "CONFIRMED" ||
          !r.expiresAt ||
          new Date(r.expiresAt) > new Date()),
    );

    return active ?? null;
  }

  async create(
    data: InsertReservation,
    ctx?: RequestContext,
  ): Promise<ReservationRecord> {
    const client = this.getClient(ctx);
    const result = await client.insert(reservation).values(data).returning();
    return result[0];
  }

  async update(
    id: string,
    data: Partial<InsertReservation>,
    ctx?: RequestContext,
  ): Promise<ReservationRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .update(reservation)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(reservation.id, id))
      .returning();
    return result[0];
  }

  async countByOrganizationAndStatuses(
    organizationId: string,
    statuses: (
      | "CREATED"
      | "AWAITING_PAYMENT"
      | "PAYMENT_MARKED_BY_USER"
      | "CONFIRMED"
      | "EXPIRED"
      | "CANCELLED"
    )[],
    ctx?: RequestContext,
  ): Promise<number> {
    const client = this.getClient(ctx);

    // Join reservation -> timeSlot -> court to filter by organization
    const result = await client
      .select({ count: count() })
      .from(reservation)
      .innerJoin(timeSlot, eq(reservation.timeSlotId, timeSlot.id))
      .innerJoin(court, eq(timeSlot.courtId, court.id))
      .where(
        and(
          eq(court.organizationId, organizationId),
          inArray(reservation.status, statuses),
        ),
      );

    return result[0]?.count ?? 0;
  }

  /**
   * Get reservations with slot and court details for an organization
   * Uses JOINs to avoid N+1 queries
   */
  async findWithDetailsByOrganization(
    organizationId: string,
    filters: {
      courtId?: string;
      status?: string;
      limit: number;
      offset: number;
    },
    ctx?: RequestContext,
  ): Promise<ReservationWithDetails[]> {
    const client = this.getClient(ctx);

    // Build query with joins
    const conditions = [eq(court.organizationId, organizationId)];

    if (filters.courtId) {
      conditions.push(eq(court.id, filters.courtId));
    }

    if (filters.status) {
      conditions.push(
        eq(
          reservation.status,
          filters.status as
            | "CREATED"
            | "AWAITING_PAYMENT"
            | "PAYMENT_MARKED_BY_USER"
            | "CONFIRMED"
            | "EXPIRED"
            | "CANCELLED",
        ),
      );
    }

    const query = client
      .select({
        id: reservation.id,
        status: reservation.status,
        playerNameSnapshot: reservation.playerNameSnapshot,
        playerEmailSnapshot: reservation.playerEmailSnapshot,
        playerPhoneSnapshot: reservation.playerPhoneSnapshot,
        cancellationReason: reservation.cancellationReason,
        createdAt: reservation.createdAt,
        courtId: court.id,
        courtName: court.name,
        slotStartTime: timeSlot.startTime,
        slotEndTime: timeSlot.endTime,
        amountCents: sql<
          number | null
        >`coalesce(${timeSlot.priceCents}, ${reservableCourtDetail.defaultPriceCents})`,
        currency: sql<
          string | null
        >`coalesce(${timeSlot.currency}, ${reservableCourtDetail.defaultCurrency})`,
        paymentProof: {
          referenceNumber: paymentProof.referenceNumber,
          notes: paymentProof.notes,
          fileUrl: paymentProof.fileUrl,
          createdAt: paymentProof.createdAt,
        },
      })
      .from(reservation)
      .innerJoin(timeSlot, eq(reservation.timeSlotId, timeSlot.id))
      .innerJoin(court, eq(timeSlot.courtId, court.id))
      .leftJoin(
        reservableCourtDetail,
        eq(reservableCourtDetail.courtId, court.id),
      )
      .leftJoin(paymentProof, eq(paymentProof.reservationId, reservation.id))
      .where(and(...conditions))
      .orderBy(desc(reservation.createdAt))
      .limit(filters.limit)
      .offset(filters.offset);

    const results = await query;

    return results.map((r) => {
      const proof = r.paymentProof;
      const hasProof =
        proof?.referenceNumber ||
        proof?.notes ||
        proof?.fileUrl ||
        proof?.createdAt;

      return {
        ...r,
        slotStartTime: r.slotStartTime?.toISOString() ?? "",
        slotEndTime: r.slotEndTime?.toISOString() ?? "",
        createdAt: r.createdAt?.toISOString() ?? null,
        paymentProof: hasProof
          ? {
              referenceNumber: proof?.referenceNumber ?? null,
              notes: proof?.notes ?? null,
              fileUrl: proof?.fileUrl ?? null,
              createdAt: proof?.createdAt?.toISOString() ?? "",
            }
          : null,
      };
    });
  }
}
