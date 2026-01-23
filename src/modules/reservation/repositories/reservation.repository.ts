import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import {
  court,
  type InsertReservation,
  paymentProof,
  place,
  placePhoto,
  type ReservationRecord,
  reservation,
  reservationTimeSlot,
  timeSlot,
} from "@/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/shared/infra/db/types";
import type { RequestContext } from "@/shared/kernel/context";
import type { ReservationListItemRecord } from "../dtos/reservation-list.dto";
import type { ReservationWithDetails } from "../dtos/reservation-owner.dto";

export interface IReservationRepository {
  findById(id: string, ctx?: RequestContext): Promise<ReservationRecord | null>;
  findByIdForUpdate(
    id: string,
    ctx: RequestContext,
  ): Promise<ReservationRecord | null>;
  findTimeSlotIdsByReservationId(
    reservationId: string,
    ctx?: RequestContext,
  ): Promise<string[]>;
  createTimeSlotLinks(
    reservationId: string,
    timeSlotIds: string[],
    ctx?: RequestContext,
  ): Promise<void>;
  findByPlayerId(
    playerId: string,
    pagination: { limit: number; offset: number },
    options?: {
      status?: string;
      upcoming?: boolean;
    },
    ctx?: RequestContext,
  ): Promise<ReservationRecord[]>;
  findWithDetailsByPlayerId(
    playerId: string,
    filters: {
      status?: string;
      upcoming?: boolean;
      limit: number;
      offset: number;
    },
    ctx?: RequestContext,
  ): Promise<ReservationListItemRecord[]>;
  findByTimeSlotId(
    timeSlotId: string,
    ctx?: RequestContext,
  ): Promise<ReservationRecord[]>;
  findActiveByTimeSlotId(
    timeSlotId: string,
    ctx?: RequestContext,
  ): Promise<ReservationRecord | null>;
  findByCourtIdAndStatus(
    courtId: string,
    status:
      | "CREATED"
      | "AWAITING_PAYMENT"
      | "PAYMENT_MARKED_BY_USER"
      | "CONFIRMED"
      | "EXPIRED"
      | "CANCELLED",
    ctx?: RequestContext,
  ): Promise<ReservationRecord[]>;
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
      reservationId?: string;
      placeId?: string;
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

const toIsoString = (
  value: Date | string | null | undefined,
): string | null => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return new Date(value).toISOString();
  return null;
};

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

  async findTimeSlotIdsByReservationId(
    reservationId: string,
    ctx?: RequestContext,
  ): Promise<string[]> {
    const client = this.getClient(ctx);
    const result = await client
      .select({ timeSlotId: reservationTimeSlot.timeSlotId })
      .from(reservationTimeSlot)
      .where(eq(reservationTimeSlot.reservationId, reservationId))
      .orderBy(reservationTimeSlot.sequence);

    return result.map((row) => row.timeSlotId);
  }

  async createTimeSlotLinks(
    reservationId: string,
    timeSlotIds: string[],
    ctx?: RequestContext,
  ): Promise<void> {
    if (timeSlotIds.length === 0) return;
    const client = this.getClient(ctx);
    await client.insert(reservationTimeSlot).values(
      timeSlotIds.map((timeSlotId, index) => ({
        reservationId,
        timeSlotId,
        sequence: index,
      })),
    );
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
        sql`${timeSlot.startTime} > now()`,
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

      return results.map((r) => r.reservation);
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

  async findWithDetailsByPlayerId(
    playerId: string,
    filters: {
      status?: string;
      upcoming?: boolean;
      limit: number;
      offset: number;
    },
    ctx?: RequestContext,
  ): Promise<ReservationListItemRecord[]> {
    const client = this.getClient(ctx);
    const conditions = [eq(reservation.playerId, playerId)];

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

    let query = client
      .select({
        id: reservation.id,
        status: reservation.status,
        playerNameSnapshot: reservation.playerNameSnapshot,
        playerPhoneSnapshot: reservation.playerPhoneSnapshot,
        createdAt: reservation.createdAt,
        expiresAt: reservation.expiresAt,
        timeSlotId: reservation.timeSlotId,
        courtId: court.id,
        courtName: sql<string>`concat(${place.name}, ' - ', ${court.label})`,
        placeId: place.id,
        placeName: place.name,
        placeAddress: place.address,
        placeCity: place.city,
        coverImageUrl: sql<
          string | null
        >`(array_agg(${placePhoto.url} order by ${placePhoto.displayOrder}))[1]`,
        slotStartTime: sql<Date>`min(${timeSlot.startTime})`,
        slotEndTime: sql<Date>`max(${timeSlot.endTime})`,
        amountCents: sql<number>`sum(coalesce(${timeSlot.priceCents}, 0))`,
        currency: sql<string>`max(${timeSlot.currency})`,
      })
      .from(reservation)
      .leftJoin(
        reservationTimeSlot,
        eq(reservationTimeSlot.reservationId, reservation.id),
      )
      .innerJoin(
        timeSlot,
        sql`${timeSlot.id} = coalesce(${reservationTimeSlot.timeSlotId}, ${reservation.timeSlotId})`,
      )
      .innerJoin(court, eq(timeSlot.courtId, court.id))
      .innerJoin(place, eq(court.placeId, place.id))
      .leftJoin(placePhoto, eq(placePhoto.placeId, place.id))
      .where(and(...conditions))
      .groupBy(
        reservation.id,
        reservation.status,
        reservation.playerNameSnapshot,
        reservation.playerPhoneSnapshot,
        reservation.createdAt,
        reservation.expiresAt,
        reservation.timeSlotId,
        court.id,
        court.label,
        place.id,
        place.name,
        place.address,
        place.city,
      )
      .$dynamic();

    if (filters.upcoming) {
      query = query.having(sql`min(${timeSlot.startTime}) > now()`);
      query = query.orderBy(asc(sql`min(${timeSlot.startTime})`));
    } else {
      query = query.orderBy(desc(reservation.createdAt));
    }

    const results = await query.limit(filters.limit).offset(filters.offset);

    return results.map((row) => ({
      ...row,
      coverImageUrl: row.coverImageUrl ?? null,
      createdAt: toIsoString(row.createdAt),
      expiresAt: toIsoString(row.expiresAt),
      slotStartTime: toIsoString(row.slotStartTime) ?? "",
      slotEndTime: toIsoString(row.slotEndTime) ?? "",
    }));
  }

  async findByTimeSlotId(
    timeSlotId: string,
    ctx?: RequestContext,
  ): Promise<ReservationRecord[]> {
    const client = this.getClient(ctx);
    const results = await client
      .select({ reservation })
      .from(reservation)
      .innerJoin(
        reservationTimeSlot,
        eq(reservationTimeSlot.reservationId, reservation.id),
      )
      .where(eq(reservationTimeSlot.timeSlotId, timeSlotId));

    const linkedReservations = results.map((row) => row.reservation);
    if (linkedReservations.length > 0) {
      return linkedReservations;
    }

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
    const results = await client
      .select({ reservation })
      .from(reservation)
      .innerJoin(
        reservationTimeSlot,
        eq(reservationTimeSlot.reservationId, reservation.id),
      )
      .where(eq(reservationTimeSlot.timeSlotId, timeSlotId));

    const linkedReservations = results.map((row) => row.reservation);
    const active = linkedReservations.find(
      (record) =>
        record.status !== "CANCELLED" &&
        record.status !== "EXPIRED" &&
        (record.status === "CONFIRMED" ||
          !record.expiresAt ||
          new Date(record.expiresAt) > new Date()),
    );

    if (active || linkedReservations.length > 0) {
      return active ?? null;
    }

    const fallback = await client
      .select()
      .from(reservation)
      .where(eq(reservation.timeSlotId, timeSlotId));

    const fallbackActive = fallback.find(
      (record) =>
        record.status !== "CANCELLED" &&
        record.status !== "EXPIRED" &&
        (record.status === "CONFIRMED" ||
          !record.expiresAt ||
          new Date(record.expiresAt) > new Date()),
    );

    return fallbackActive ?? null;
  }

  async findByCourtIdAndStatus(
    courtId: string,
    status:
      | "CREATED"
      | "AWAITING_PAYMENT"
      | "PAYMENT_MARKED_BY_USER"
      | "CONFIRMED"
      | "EXPIRED"
      | "CANCELLED",
    ctx?: RequestContext,
  ): Promise<ReservationRecord[]> {
    const client = this.getClient(ctx);
    const results = await client
      .select({ reservation })
      .from(reservation)
      .innerJoin(
        reservationTimeSlot,
        eq(reservationTimeSlot.reservationId, reservation.id),
      )
      .innerJoin(timeSlot, eq(timeSlot.id, reservationTimeSlot.timeSlotId))
      .where(
        and(eq(timeSlot.courtId, courtId), eq(reservation.status, status)),
      );

    const unique = new Map(
      results.map((row) => [row.reservation.id, row.reservation]),
    );

    if (unique.size > 0) {
      return Array.from(unique.values());
    }

    const fallback = await client
      .select({ reservation })
      .from(reservation)
      .innerJoin(timeSlot, eq(reservation.timeSlotId, timeSlot.id))
      .where(
        and(eq(timeSlot.courtId, courtId), eq(reservation.status, status)),
      );

    return fallback.map((row) => row.reservation);
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
      .innerJoin(place, eq(court.placeId, place.id))
      .where(
        and(
          eq(place.organizationId, organizationId),
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
      reservationId?: string;
      placeId?: string;
      courtId?: string;
      status?: string;
      limit: number;
      offset: number;
    },
    ctx?: RequestContext,
  ): Promise<ReservationWithDetails[]> {
    const client = this.getClient(ctx);

    // Build query with joins
    const conditions = [eq(place.organizationId, organizationId)];

    if (filters.placeId) {
      conditions.push(eq(place.id, filters.placeId));
    }

    if (filters.courtId) {
      conditions.push(eq(court.id, filters.courtId));
    }

    if (filters.reservationId) {
      conditions.push(eq(reservation.id, filters.reservationId));
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
        expiresAt: reservation.expiresAt,
        courtId: court.id,
        courtName: sql<string>`concat(${place.name}, ' - ', ${court.label})`,
        slotStartTime: sql<Date>`min(${timeSlot.startTime})`,
        slotEndTime: sql<Date>`max(${timeSlot.endTime})`,
        amountCents: sql<number>`sum(coalesce(${timeSlot.priceCents}, 0))`,
        currency: sql<string>`max(${timeSlot.currency})`,
        paymentProofReferenceNumber: paymentProof.referenceNumber,
        paymentProofNotes: paymentProof.notes,
        paymentProofFileUrl: paymentProof.fileUrl,
        paymentProofCreatedAt: paymentProof.createdAt,
      })
      .from(reservation)
      .leftJoin(
        reservationTimeSlot,
        eq(reservationTimeSlot.reservationId, reservation.id),
      )
      .innerJoin(
        timeSlot,
        sql`${timeSlot.id} = coalesce(${reservationTimeSlot.timeSlotId}, ${reservation.timeSlotId})`,
      )
      .innerJoin(court, eq(timeSlot.courtId, court.id))
      .innerJoin(place, eq(court.placeId, place.id))
      .leftJoin(paymentProof, eq(paymentProof.reservationId, reservation.id))
      .where(and(...conditions))
      .groupBy(
        reservation.id,
        reservation.status,
        reservation.playerNameSnapshot,
        reservation.playerEmailSnapshot,
        reservation.playerPhoneSnapshot,
        reservation.cancellationReason,
        reservation.createdAt,
        reservation.expiresAt,
        court.id,
        court.label,
        place.name,
        paymentProof.referenceNumber,
        paymentProof.notes,
        paymentProof.fileUrl,
        paymentProof.createdAt,
      )
      .orderBy(desc(reservation.createdAt))
      .limit(filters.limit)
      .offset(filters.offset);

    const results = await query;

    return results.map((r) => {
      const proof = {
        referenceNumber: r.paymentProofReferenceNumber ?? null,
        notes: r.paymentProofNotes ?? null,
        fileUrl: r.paymentProofFileUrl ?? null,
        createdAt: r.paymentProofCreatedAt ?? null,
      };
      const hasProof =
        proof.referenceNumber ||
        proof.notes ||
        proof.fileUrl ||
        proof.createdAt;

      return {
        ...r,
        slotStartTime: toIsoString(r.slotStartTime) ?? "",
        slotEndTime: toIsoString(r.slotEndTime) ?? "",
        createdAt: toIsoString(r.createdAt),
        expiresAt: toIsoString(r.expiresAt),
        paymentProof: hasProof
          ? {
              referenceNumber: proof.referenceNumber,
              notes: proof.notes,
              fileUrl: proof.fileUrl,
              createdAt: toIsoString(proof.createdAt) ?? "",
            }
          : null,
      };
    });
  }
}
