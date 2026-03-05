import { and, eq, sql, inArray } from "drizzle-orm";
import { court } from "@/lib/shared/infra/db/schema/court";
import { courtHoursWindow } from "@/lib/shared/infra/db/schema/court-hours-window";
import { place } from "@/lib/shared/infra/db/schema/place";
import type { DbClient } from "@/lib/shared/infra/db/types";

function pgArray(ids: string[]) {
  return sql`ARRAY[${sql.join(ids.map((id) => sql`${id}`), sql`, `)}]::uuid[]`;
}

export class AnalyticsRepository {
  constructor(private db: DbClient) {}

  async getCourtIdsForOrganization(organizationId: string): Promise<string[]> {
    const rows = await this.db
      .select({ id: court.id })
      .from(court)
      .innerJoin(place, eq(court.placeId, place.id))
      .where(
        and(
          eq(place.organizationId, organizationId),
          eq(court.isActive, true),
        ),
      );
    return rows.map((r) => r.id);
  }

  async getPlaceTimeZone(organizationId: string): Promise<string> {
    const rows = await this.db
      .select({ timeZone: place.timeZone })
      .from(place)
      .where(eq(place.organizationId, organizationId))
      .limit(1);
    return rows[0]?.timeZone ?? "Asia/Manila";
  }

  // ── Revenue Queries ─────────────────────────────────────────────────────

  async getRevenueByDay(
    courtIds: string[],
    from: string,
    to: string,
    tz: string,
  ) {
    if (courtIds.length === 0) return [];
    const rows = await this.db.execute<{
      date: string;
      total_cents: string;
      booking_count: string;
    }>(sql`
      SELECT
        TO_CHAR(r.start_time AT TIME ZONE ${tz}, 'YYYY-MM-DD') AS date,
        COALESCE(SUM(r.total_price_cents), 0)::text AS total_cents,
        COUNT(*)::text AS booking_count
      FROM reservation r
      WHERE r.court_id = ANY(${pgArray(courtIds)})
        AND r.status = 'CONFIRMED'
        AND r.start_time >= ${from}::timestamptz
        AND r.start_time < ${to}::timestamptz
      GROUP BY date
      ORDER BY date
    `);
    return rows.map((r) => ({
      date: r.date,
      totalCents: Number(r.total_cents),
      bookingCount: Number(r.booking_count),
    }));
  }

  async getRevenueByCourt(
    courtIds: string[],
    from: string,
    to: string,
  ) {
    if (courtIds.length === 0) return [];
    const rows = await this.db.execute<{
      court_id: string;
      court_label: string;
      total_cents: string;
    }>(sql`
      SELECT
        c.id AS court_id,
        c.label AS court_label,
        COALESCE(SUM(r.total_price_cents), 0)::text AS total_cents
      FROM reservation r
      INNER JOIN court c ON c.id = r.court_id
      WHERE r.court_id = ANY(${pgArray(courtIds)})
        AND r.status = 'CONFIRMED'
        AND r.start_time >= ${from}::timestamptz
        AND r.start_time < ${to}::timestamptz
      GROUP BY c.id, c.label
      ORDER BY total_cents DESC
      LIMIT 8
    `);
    return rows.map((r) => ({
      courtId: r.court_id,
      courtLabel: r.court_label,
      totalCents: Number(r.total_cents),
    }));
  }

  async getRevenueByDow(
    courtIds: string[],
    from: string,
    to: string,
    tz: string,
  ) {
    if (courtIds.length === 0) return [];
    const rows = await this.db.execute<{
      dow: string;
      total_cents: string;
    }>(sql`
      SELECT
        EXTRACT(DOW FROM r.start_time AT TIME ZONE ${tz})::int AS dow,
        COALESCE(SUM(r.total_price_cents), 0)::text AS total_cents
      FROM reservation r
      WHERE r.court_id = ANY(${pgArray(courtIds)})
        AND r.status = 'CONFIRMED'
        AND r.start_time >= ${from}::timestamptz
        AND r.start_time < ${to}::timestamptz
      GROUP BY dow
      ORDER BY dow
    `);
    return rows.map((r) => ({
      dow: Number(r.dow),
      totalCents: Number(r.total_cents),
    }));
  }

  async getRevenueByHour(
    courtIds: string[],
    from: string,
    to: string,
    tz: string,
  ) {
    if (courtIds.length === 0) return [];
    const rows = await this.db.execute<{
      hour: string;
      total_cents: string;
    }>(sql`
      SELECT
        EXTRACT(HOUR FROM r.start_time AT TIME ZONE ${tz})::int AS hour,
        COALESCE(SUM(r.total_price_cents), 0)::text AS total_cents
      FROM reservation r
      WHERE r.court_id = ANY(${pgArray(courtIds)})
        AND r.status = 'CONFIRMED'
        AND r.start_time >= ${from}::timestamptz
        AND r.start_time < ${to}::timestamptz
      GROUP BY hour
      ORDER BY hour
    `);
    return rows.map((r) => ({
      hour: Number(r.hour),
      totalCents: Number(r.total_cents),
    }));
  }

  async getRevenueTotals(courtIds: string[], from: string, to: string) {
    if (courtIds.length === 0)
      return { totalCents: 0, bookingCount: 0 };
    const rows = await this.db.execute<{
      total_cents: string;
      booking_count: string;
    }>(sql`
      SELECT
        COALESCE(SUM(r.total_price_cents), 0)::text AS total_cents,
        COUNT(*)::text AS booking_count
      FROM reservation r
      WHERE r.court_id = ANY(${pgArray(courtIds)})
        AND r.status = 'CONFIRMED'
        AND r.start_time >= ${from}::timestamptz
        AND r.start_time < ${to}::timestamptz
    `);
    return {
      totalCents: Number(rows[0]?.total_cents ?? 0),
      bookingCount: Number(rows[0]?.booking_count ?? 0),
    };
  }

  // ── Utilization Queries ─────────────────────────────────────────────────

  async getCourtHoursWindows(courtIds: string[]) {
    if (courtIds.length === 0) return [];
    return this.db
      .select({
        courtId: courtHoursWindow.courtId,
        dayOfWeek: courtHoursWindow.dayOfWeek,
        startMinute: courtHoursWindow.startMinute,
        endMinute: courtHoursWindow.endMinute,
      })
      .from(courtHoursWindow)
      .where(inArray(courtHoursWindow.courtId, courtIds));
  }

  async getConfirmedReservationSlots(
    courtIds: string[],
    from: string,
    to: string,
  ) {
    if (courtIds.length === 0) return [];
    const rows = await this.db.execute<{
      court_id: string;
      start_time: string;
      end_time: string;
    }>(sql`
      SELECT
        r.court_id,
        r.start_time::text,
        r.end_time::text
      FROM reservation r
      WHERE r.court_id = ANY(${pgArray(courtIds)})
        AND r.status = 'CONFIRMED'
        AND r.start_time >= ${from}::timestamptz
        AND r.start_time < ${to}::timestamptz
    `);
    return rows;
  }

  async getHeatmapData(
    courtIds: string[],
    from: string,
    to: string,
    tz: string,
  ) {
    if (courtIds.length === 0) return [];
    const rows = await this.db.execute<{
      dow: string;
      hour: string;
      booked_hours: string;
    }>(sql`
      SELECT
        EXTRACT(DOW FROM r.start_time AT TIME ZONE ${tz})::int AS dow,
        EXTRACT(HOUR FROM r.start_time AT TIME ZONE ${tz})::int AS hour,
        SUM(EXTRACT(EPOCH FROM (r.end_time - r.start_time)) / 3600)::text AS booked_hours
      FROM reservation r
      WHERE r.court_id = ANY(${pgArray(courtIds)})
        AND r.status = 'CONFIRMED'
        AND r.start_time >= ${from}::timestamptz
        AND r.start_time < ${to}::timestamptz
      GROUP BY dow, hour
      ORDER BY dow, hour
    `);
    return rows.map((r) => ({
      dow: Number(r.dow),
      hour: Number(r.hour),
      bookedHours: Number(r.booked_hours),
    }));
  }

  async getMaintenanceHours(
    courtIds: string[],
    from: string,
    to: string,
  ) {
    if (courtIds.length === 0) return 0;
    const rows = await this.db.execute<{ total_hours: string }>(sql`
      SELECT
        COALESCE(SUM(EXTRACT(EPOCH FROM (cb.end_time - cb.start_time)) / 3600), 0)::text AS total_hours
      FROM court_block cb
      WHERE cb.court_id = ANY(${pgArray(courtIds)})
        AND cb.type = 'MAINTENANCE'
        AND cb.is_active = true
        AND cb.start_time >= ${from}::timestamptz
        AND cb.start_time < ${to}::timestamptz
    `);
    return Number(rows[0]?.total_hours ?? 0);
  }

  // ── Operations Queries ──────────────────────────────────────────────────

  async getResponseTimes(
    courtIds: string[],
    from: string,
    to: string,
  ) {
    if (courtIds.length === 0) return [];
    const rows = await this.db.execute<{
      response_minutes: string;
    }>(sql`
      SELECT
        EXTRACT(EPOCH FROM (first_owner.created_at - r.created_at)) / 60 AS response_minutes
      FROM reservation r
      INNER JOIN LATERAL (
        SELECT re.created_at
        FROM reservation_event re
        WHERE re.reservation_id = r.id
          AND re.triggered_by_role = 'OWNER'
        ORDER BY re.created_at
        LIMIT 1
      ) first_owner ON true
      WHERE r.court_id = ANY(${pgArray(courtIds)})
        AND r.created_at >= ${from}::timestamptz
        AND r.created_at < ${to}::timestamptz
        AND r.status IN ('CONFIRMED', 'CANCELLED')
    `);
    return rows.map((r) => Number(r.response_minutes));
  }

  async getCancellationBreakdown(
    courtIds: string[],
    from: string,
    to: string,
  ) {
    if (courtIds.length === 0) return [];
    const rows = await this.db.execute<{
      reason: string;
      count: string;
    }>(sql`
      SELECT
        CASE
          WHEN r.status = 'EXPIRED' THEN 'expired'
          WHEN re.triggered_by_role = 'OWNER' THEN 'owner_rejected'
          WHEN re.triggered_by_role = 'PLAYER' THEN 'player_cancelled'
          ELSE 'system'
        END AS reason,
        COUNT(*)::text AS count
      FROM reservation r
      LEFT JOIN LATERAL (
        SELECT re2.triggered_by_role
        FROM reservation_event re2
        WHERE re2.reservation_id = r.id
          AND re2.to_status IN ('CANCELLED', 'EXPIRED')
        ORDER BY re2.created_at DESC
        LIMIT 1
      ) re ON true
      WHERE r.court_id = ANY(${pgArray(courtIds)})
        AND r.status IN ('CANCELLED', 'EXPIRED')
        AND r.created_at >= ${from}::timestamptz
        AND r.created_at < ${to}::timestamptz
      GROUP BY reason
    `);
    return rows.map((r) => ({
      reason: r.reason,
      count: Number(r.count),
    }));
  }

  async getTotalReservationCount(
    courtIds: string[],
    from: string,
    to: string,
  ) {
    if (courtIds.length === 0) return 0;
    const rows = await this.db.execute<{ count: string }>(sql`
      SELECT COUNT(*)::text AS count
      FROM reservation r
      WHERE r.court_id = ANY(${pgArray(courtIds)})
        AND r.created_at >= ${from}::timestamptz
        AND r.created_at < ${to}::timestamptz
    `);
    return Number(rows[0]?.count ?? 0);
  }

  async getLeadTimes(
    courtIds: string[],
    from: string,
    to: string,
  ) {
    if (courtIds.length === 0) return [];
    const rows = await this.db.execute<{
      lead_hours: string;
    }>(sql`
      SELECT
        EXTRACT(EPOCH FROM (r.start_time - r.created_at)) / 3600 AS lead_hours
      FROM reservation r
      WHERE r.court_id = ANY(${pgArray(courtIds)})
        AND r.status = 'CONFIRMED'
        AND r.created_at >= ${from}::timestamptz
        AND r.created_at < ${to}::timestamptz
    `);
    return rows.map((r) => Number(r.lead_hours));
  }

  async getBookingsByHourCreated(
    courtIds: string[],
    from: string,
    to: string,
    tz: string,
  ) {
    if (courtIds.length === 0) return [];
    const rows = await this.db.execute<{
      hour: string;
      count: string;
    }>(sql`
      SELECT
        EXTRACT(HOUR FROM r.created_at AT TIME ZONE ${tz})::int AS hour,
        COUNT(*)::text AS count
      FROM reservation r
      WHERE r.court_id = ANY(${pgArray(courtIds)})
        AND r.created_at >= ${from}::timestamptz
        AND r.created_at < ${to}::timestamptz
      GROUP BY hour
      ORDER BY hour
    `);
    return rows.map((r) => ({
      hour: Number(r.hour),
      count: Number(r.count),
    }));
  }

  async getCourtLabels(courtIds: string[]) {
    if (courtIds.length === 0) return new Map<string, string>();
    const rows = await this.db
      .select({ id: court.id, label: court.label })
      .from(court)
      .where(inArray(court.id, courtIds));
    return new Map(rows.map((r) => [r.id, r.label]));
  }
}
