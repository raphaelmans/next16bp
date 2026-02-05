import { and, asc, count, desc, eq, gt, inArray, lt, sql } from "drizzle-orm";
import {
  court,
  type InsertReservation,
  paymentProof,
  place,
  placePhoto,
  type ReservationRecord,
  reservation,
} from "@/lib/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/lib/shared/infra/db/types";
import type { RequestContext } from "@/lib/shared/kernel/context";
import type { ReservationListItemRecord } from "../dtos/reservation-list.dto";
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
  findOverlappingActiveByCourtIds(
    courtIds: string[],
    startTime: Date,
    endTime: Date,
    ctx?: RequestContext,
  ): Promise<ReservationRecord[]>;
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

  findStaleByOrganization(
    organizationId: string,
    now: Date,
    statuses: ("CREATED" | "AWAITING_PAYMENT" | "PAYMENT_MARKED_BY_USER")[],
    ctx?: RequestContext,
  ): Promise<
    {
      id: string;
      status: ReservationRecord["status"];
    }[]
  >;

  expireStaleByIds(
    reservationIds: string[],
    now: Date,
    statuses: ("CREATED" | "AWAITING_PAYMENT" | "PAYMENT_MARKED_BY_USER")[],
    ctx: RequestContext,
  ): Promise<string[]>;
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

    if (options?.upcoming) {
      conditions.push(sql`${reservation.startTime} > now()`);
    }

    return client
      .select()
      .from(reservation)
      .where(and(...conditions))
      .orderBy(
        options?.upcoming
          ? asc(reservation.startTime)
          : desc(reservation.createdAt),
      )
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

    if (filters.upcoming) {
      conditions.push(sql`${reservation.startTime} > now()`);
    }

    const query = client
      .select({
        id: reservation.id,
        status: reservation.status,
        playerNameSnapshot: reservation.playerNameSnapshot,
        playerPhoneSnapshot: reservation.playerPhoneSnapshot,
        createdAt: reservation.createdAt,
        expiresAt: reservation.expiresAt,
        courtId: court.id,
        courtName: sql<string>`concat(${place.name}, ' - ', ${court.label})`,
        placeId: place.id,
        placeName: place.name,
        placeAddress: place.address,
        placeCity: place.city,
        coverImageUrl: sql<
          string | null
        >`(array_agg(${placePhoto.url} order by ${placePhoto.displayOrder}))[1]`,
        slotStartTime: reservation.startTime,
        slotEndTime: reservation.endTime,
        amountCents: reservation.totalPriceCents,
        currency: reservation.currency,
      })
      .from(reservation)
      .innerJoin(court, eq(reservation.courtId, court.id))
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
        reservation.startTime,
        reservation.endTime,
        reservation.totalPriceCents,
        reservation.currency,
        court.id,
        court.label,
        place.id,
        place.name,
        place.address,
        place.city,
      )
      .orderBy(
        filters.upcoming
          ? asc(reservation.startTime)
          : desc(reservation.createdAt),
      )
      .limit(filters.limit)
      .offset(filters.offset);

    const results = await query;

    return results.map((row) => ({
      ...row,
      coverImageUrl: row.coverImageUrl ?? null,
      createdAt: toIsoString(row.createdAt),
      expiresAt: toIsoString(row.expiresAt),
      slotStartTime: toIsoString(row.slotStartTime) ?? "",
      slotEndTime: toIsoString(row.slotEndTime) ?? "",
    }));
  }

  async findOverlappingActiveByCourtIds(
    courtIds: string[],
    startTime: Date,
    endTime: Date,
    ctx?: RequestContext,
  ): Promise<ReservationRecord[]> {
    const client = this.getClient(ctx);
    if (courtIds.length === 0) return [];

    const candidates = await client
      .select()
      .from(reservation)
      .where(
        and(
          inArray(reservation.courtId, courtIds),
          inArray(reservation.status, [
            "CREATED",
            "AWAITING_PAYMENT",
            "PAYMENT_MARKED_BY_USER",
            "CONFIRMED",
          ]),
          lt(reservation.startTime, endTime),
          gt(reservation.endTime, startTime),
        ),
      );

    const now = new Date();
    return candidates.filter((record) => {
      if (record.status === "CONFIRMED") return true;
      if (!record.expiresAt) return true;
      return new Date(record.expiresAt) > now;
    });
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
    return client
      .select()
      .from(reservation)
      .where(
        and(eq(reservation.courtId, courtId), eq(reservation.status, status)),
      )
      .orderBy(desc(reservation.createdAt));
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

    const result = await client
      .select({ count: count() })
      .from(reservation)
      .innerJoin(court, eq(reservation.courtId, court.id))
      .innerJoin(place, eq(court.placeId, place.id))
      .where(
        and(
          eq(place.organizationId, organizationId),
          inArray(reservation.status, statuses),
        ),
      );

    return result[0]?.count ?? 0;
  }

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

    const results = await client
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
        slotStartTime: reservation.startTime,
        slotEndTime: reservation.endTime,
        amountCents: reservation.totalPriceCents,
        currency: reservation.currency,
        paymentProofReferenceNumber: paymentProof.referenceNumber,
        paymentProofNotes: paymentProof.notes,
        paymentProofFileUrl: paymentProof.fileUrl,
        paymentProofFilePath: paymentProof.filePath,
        paymentProofCreatedAt: paymentProof.createdAt,
      })
      .from(reservation)
      .innerJoin(court, eq(reservation.courtId, court.id))
      .innerJoin(place, eq(court.placeId, place.id))
      .leftJoin(paymentProof, eq(paymentProof.reservationId, reservation.id))
      .where(and(...conditions))
      .orderBy(desc(reservation.createdAt))
      .limit(filters.limit)
      .offset(filters.offset);

    return results.map((r) => {
      const proof = {
        referenceNumber: r.paymentProofReferenceNumber ?? null,
        notes: r.paymentProofNotes ?? null,
        fileUrl: r.paymentProofFileUrl ?? null,
        filePath: r.paymentProofFilePath ?? null,
        createdAt: r.paymentProofCreatedAt ?? null,
      };
      const hasProof =
        proof.referenceNumber ||
        proof.notes ||
        proof.fileUrl ||
        proof.filePath ||
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
              filePath: proof.filePath,
              createdAt: toIsoString(proof.createdAt) ?? "",
            }
          : null,
      };
    });
  }

  async findStaleByOrganization(
    organizationId: string,
    now: Date,
    statuses: ("CREATED" | "AWAITING_PAYMENT" | "PAYMENT_MARKED_BY_USER")[],
    ctx?: RequestContext,
  ): Promise<
    {
      id: string;
      status: ReservationRecord["status"];
    }[]
  > {
    const client = this.getClient(ctx);

    return client
      .select({
        id: reservation.id,
        status: reservation.status,
      })
      .from(reservation)
      .innerJoin(court, eq(reservation.courtId, court.id))
      .innerJoin(place, eq(court.placeId, place.id))
      .where(
        and(
          eq(place.organizationId, organizationId),
          lt(reservation.expiresAt, now),
          inArray(reservation.status, statuses),
        ),
      );
  }

  async expireStaleByIds(
    reservationIds: string[],
    now: Date,
    statuses: ("CREATED" | "AWAITING_PAYMENT" | "PAYMENT_MARKED_BY_USER")[],
    ctx: RequestContext,
  ): Promise<string[]> {
    if (reservationIds.length === 0) return [];
    const client = this.getClient(ctx);

    const updated = await client
      .update(reservation)
      .set({ status: "EXPIRED", updatedAt: now })
      .where(
        and(
          inArray(reservation.id, reservationIds),
          inArray(reservation.status, statuses),
          lt(reservation.expiresAt, now),
        ),
      )
      .returning({ id: reservation.id });

    return updated.map((r) => r.id);
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
}
