import { eq } from "drizzle-orm";
import type { RequestContext } from "@/shared/kernel/context";
import type {
  ReservationEventRecord,
  ClaimRequestEventRecord,
} from "@/shared/infra/db/schema";
import {
  reservation,
  reservationEvent,
  claimRequest,
  claimRequestEvent,
  profile,
  timeSlot,
  court,
  organization,
  userRoles,
} from "@/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/shared/infra/db/types";
import { AuthorizationError, NotFoundError } from "@/shared/kernel/errors";

class ReservationNotFoundError extends NotFoundError {
  readonly code = "RESERVATION_NOT_FOUND";
  constructor(reservationId: string) {
    super("Reservation not found", { reservationId });
  }
}

class ClaimRequestNotFoundError extends NotFoundError {
  readonly code = "CLAIM_REQUEST_NOT_FOUND";
  constructor(claimRequestId: string) {
    super("Claim request not found", { claimRequestId });
  }
}

export interface IAuditService {
  getReservationHistory(
    userId: string,
    reservationId: string,
    ctx?: RequestContext,
  ): Promise<ReservationEventRecord[]>;
  getClaimRequestHistory(
    adminUserId: string,
    claimRequestId: string,
    ctx?: RequestContext,
  ): Promise<ClaimRequestEventRecord[]>;
}

export class AuditService implements IAuditService {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async getReservationHistory(
    userId: string,
    reservationId: string,
    ctx?: RequestContext,
  ): Promise<ReservationEventRecord[]> {
    const client = this.getClient(ctx);

    // Get reservation
    const reservationResult = await client
      .select()
      .from(reservation)
      .where(eq(reservation.id, reservationId))
      .limit(1);

    if (!reservationResult[0]) {
      throw new ReservationNotFoundError(reservationId);
    }

    const res = reservationResult[0];

    // Check access: player, court owner, or admin
    // 1. Check if player
    const profileResult = await client
      .select()
      .from(profile)
      .where(eq(profile.userId, userId))
      .limit(1);

    const userProfile = profileResult[0];
    const isPlayer = userProfile && res.playerId === userProfile.id;

    // 2. Check if court owner
    let isOwner = false;
    const slotResult = await client
      .select()
      .from(timeSlot)
      .where(eq(timeSlot.id, res.timeSlotId))
      .limit(1);

    if (slotResult[0]) {
      const courtResult = await client
        .select()
        .from(court)
        .where(eq(court.id, slotResult[0].courtId))
        .limit(1);

      if (courtResult[0]?.organizationId) {
        const orgResult = await client
          .select()
          .from(organization)
          .where(eq(organization.id, courtResult[0].organizationId))
          .limit(1);

        isOwner = orgResult[0]?.ownerUserId === userId;
      }
    }

    // 3. Check if admin
    const roleResult = await client
      .select()
      .from(userRoles)
      .where(eq(userRoles.userId, userId))
      .limit(1);

    const isAdmin = roleResult[0]?.role === "admin";

    if (!isPlayer && !isOwner && !isAdmin) {
      throw new AuthorizationError(
        "Not authorized to view this reservation history",
      );
    }

    // Get events ordered by createdAt
    const events = await client
      .select()
      .from(reservationEvent)
      .where(eq(reservationEvent.reservationId, reservationId))
      .orderBy(reservationEvent.createdAt);

    return events;
  }

  async getClaimRequestHistory(
    adminUserId: string,
    claimRequestId: string,
    ctx?: RequestContext,
  ): Promise<ClaimRequestEventRecord[]> {
    const client = this.getClient(ctx);

    // Note: Admin-only is enforced by the procedure, but we verify claim exists
    const claimResult = await client
      .select()
      .from(claimRequest)
      .where(eq(claimRequest.id, claimRequestId))
      .limit(1);

    if (!claimResult[0]) {
      throw new ClaimRequestNotFoundError(claimRequestId);
    }

    // Get events ordered by createdAt
    const events = await client
      .select()
      .from(claimRequestEvent)
      .where(eq(claimRequestEvent.claimRequestId, claimRequestId))
      .orderBy(claimRequestEvent.createdAt);

    return events;
  }
}
