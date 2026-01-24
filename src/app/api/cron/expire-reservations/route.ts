import { and, eq, inArray, lt } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/shared/infra/db/drizzle";
import { reservation, reservationEvent } from "@/shared/infra/db/schema";

/**
 * Cron job to expire stale reservations.
 *
 * Per PRD Section 8.4, reservations have a 15-minute payment window.
 * This job runs every minute to:
 * 1. Find reservations where expiresAt < NOW() and status is CREATED, AWAITING_PAYMENT or PAYMENT_MARKED_BY_USER
 * 2. Update reservation status to EXPIRED
 * 3. Create audit event with triggeredByRole: SYSTEM
 *
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/expire-reservations",
 *     "schedule": "* * * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // In production, require CRON_SECRET for security
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  let expiredCount = 0;
  const errors: string[] = [];

  try {
    // Find all expired reservations that need processing
    const expiredReservations = await db
      .select({
        id: reservation.id,
        status: reservation.status,
      })
      .from(reservation)
      .where(
        and(
          lt(reservation.expiresAt, now),
          inArray(reservation.status, [
            "CREATED",
            "AWAITING_PAYMENT",
            "PAYMENT_MARKED_BY_USER",
          ]),
        ),
      );

    if (expiredReservations.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No expired reservations to process",
        expiredCount: 0,
        timestamp: now.toISOString(),
      });
    }

    // Process each expired reservation
    for (const expiredRes of expiredReservations) {
      try {
        // Use a transaction to ensure atomicity
        await db.transaction(async (tx) => {
          // 1. Update reservation status to EXPIRED
          await tx
            .update(reservation)
            .set({
              status: "EXPIRED",
              updatedAt: now,
            })
            .where(eq(reservation.id, expiredRes.id));

          // 2. Create audit event
          await tx.insert(reservationEvent).values({
            reservationId: expiredRes.id,
            fromStatus: expiredRes.status,
            toStatus: "EXPIRED",
            triggeredByRole: "SYSTEM",
            triggeredByUserId: null,
            notes: "Automatically expired due to payment timeout",
          });
        });

        expiredCount++;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        errors.push(
          `Failed to expire reservation ${expiredRes.id}: ${errorMsg}`,
        );
        console.error(
          `[CRON] Failed to expire reservation ${expiredRes.id}:`,
          err,
        );
      }
    }

    const response = {
      success: errors.length === 0,
      message: `Processed ${expiredCount} expired reservations`,
      expiredCount,
      totalFound: expiredReservations.length,
      timestamp: now.toISOString(),
      ...(errors.length > 0 && { errors }),
    };

    console.log("[CRON] expire-reservations completed:", response);

    return NextResponse.json(response);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error("[CRON] expire-reservations failed:", err);

    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
        timestamp: now.toISOString(),
      },
      { status: 500 },
    );
  }
}

// Disable body parsing for this route (not needed for GET)
export const dynamic = "force-dynamic";
