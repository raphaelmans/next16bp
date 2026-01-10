import { eq } from "drizzle-orm";
import {
  type InsertPaymentProof,
  type PaymentProofRecord,
  type ProfileRecord,
  paymentProof,
  profile,
  type ReservationRecord,
  reservation,
} from "@/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/shared/infra/db/types";
import type { RequestContext } from "@/shared/kernel/context";

export interface IPaymentProofRepository {
  findByReservationId(
    reservationId: string,
    ctx?: RequestContext,
  ): Promise<PaymentProofRecord | null>;
  create(
    data: InsertPaymentProof,
    ctx?: RequestContext,
  ): Promise<PaymentProofRecord>;
  update(
    id: string,
    data: Partial<InsertPaymentProof>,
    ctx?: RequestContext,
  ): Promise<PaymentProofRecord>;
}

export class PaymentProofRepository implements IPaymentProofRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findByReservationId(
    reservationId: string,
    ctx?: RequestContext,
  ): Promise<PaymentProofRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(paymentProof)
      .where(eq(paymentProof.reservationId, reservationId))
      .limit(1);

    return result[0] ?? null;
  }

  async create(
    data: InsertPaymentProof,
    ctx?: RequestContext,
  ): Promise<PaymentProofRecord> {
    const client = this.getClient(ctx);
    const result = await client.insert(paymentProof).values(data).returning();

    return result[0];
  }

  async update(
    id: string,
    data: Partial<InsertPaymentProof>,
    ctx?: RequestContext,
  ): Promise<PaymentProofRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .update(paymentProof)
      .set(data)
      .where(eq(paymentProof.id, id))
      .returning();

    return result[0];
  }
}

/**
 * Repository for reservation queries needed by payment proof module
 */
export interface IReservationRepository {
  findById(id: string, ctx?: RequestContext): Promise<ReservationRecord | null>;
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
}

/**
 * Repository for profile queries needed by payment proof module
 */
export interface IProfileRepository {
  findByUserId(
    userId: string,
    ctx?: RequestContext,
  ): Promise<ProfileRecord | null>;
}

export class ProfileRepository implements IProfileRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findByUserId(
    userId: string,
    ctx?: RequestContext,
  ): Promise<ProfileRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(profile)
      .where(eq(profile.userId, userId))
      .limit(1);

    return result[0] ?? null;
  }
}
