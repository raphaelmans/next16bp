import type {
  AnalyticsInput,
  OperationsOutput,
  RevenueOutput,
  UtilizationOutput,
} from "../dtos/analytics.dto";
import type { AnalyticsRepository } from "../repositories/analytics.repository";

const RESPONSE_TIME_BUCKETS = [
  { label: "<15m", max: 15 },
  { label: "15-30m", max: 30 },
  { label: "30-60m", max: 60 },
  { label: "1-2h", max: 120 },
  { label: "2-4h", max: 240 },
  { label: "4h+", max: Infinity },
];

const LEAD_TIME_BUCKETS = [
  { label: "Same-day", maxHours: 24 },
  { label: "1 day", maxHours: 48 },
  { label: "2-3 days", maxHours: 96 },
  { label: "4-7 days", maxHours: 168 },
  { label: "1-2 weeks", maxHours: 336 },
  { label: "2+ weeks", maxHours: Infinity },
];

export class AnalyticsService {
  constructor(private repo: AnalyticsRepository) {}

  async getRevenue(input: AnalyticsInput): Promise<RevenueOutput> {
    const courtIds = await this.repo.getCourtIdsForOrganization(
      input.organizationId,
    );
    const tz = await this.repo.getPlaceTimeZone(input.organizationId);
    const fromMs = new Date(input.from).getTime();
    const toMs = new Date(input.to).getTime();
    const periodMs = toMs - fromMs;
    const prevFrom = new Date(fromMs - periodMs).toISOString();
    const prevTo = input.from;

    const [totals, prevTotals, byDay, previousByDay, byCourt, byDow, byHour] =
      await Promise.all([
        this.repo.getRevenueTotals(courtIds, input.from, input.to),
        this.repo.getRevenueTotals(courtIds, prevFrom, prevTo),
        this.repo.getRevenueByDay(courtIds, input.from, input.to, tz),
        this.repo.getRevenueByDay(courtIds, prevFrom, prevTo, tz),
        this.repo.getRevenueByCourt(courtIds, input.from, input.to),
        this.repo.getRevenueByDow(courtIds, input.from, input.to, tz),
        this.repo.getRevenueByHour(courtIds, input.from, input.to, tz),
      ]);

    return {
      kpis: {
        totalRevenueCents: totals.totalCents,
        avgBookingValueCents:
          totals.bookingCount > 0
            ? Math.round(totals.totalCents / totals.bookingCount)
            : 0,
        bookingCount: totals.bookingCount,
        previousTotalRevenueCents: prevTotals.totalCents,
        previousBookingCount: prevTotals.bookingCount,
      },
      byDay,
      byCourt,
      byDow,
      byHour,
      previousByDay,
    };
  }

  async getUtilization(input: AnalyticsInput): Promise<UtilizationOutput> {
    const courtIds = await this.repo.getCourtIdsForOrganization(
      input.organizationId,
    );
    const tz = await this.repo.getPlaceTimeZone(input.organizationId);
    const fromMs = new Date(input.from).getTime();
    const toMs = new Date(input.to).getTime();

    const [windows, slots, heatmapRaw, maintenanceHours] = await Promise.all([
      this.repo.getCourtHoursWindows(courtIds),
      this.repo.getConfirmedReservationSlots(courtIds, input.from, input.to),
      this.repo.getHeatmapData(courtIds, input.from, input.to, tz),
      this.repo.getMaintenanceHours(courtIds, input.from, input.to),
    ]);

    const courtLabels = await this.repo.getCourtLabels(courtIds);

    // Calculate available hours per court over the date range
    const daysInRange = Math.ceil(
      (toMs - fromMs) / (1000 * 60 * 60 * 24),
    );
    const availableHoursByCourt = new Map<string, number>();
    for (const courtId of courtIds) {
      const courtWindows = windows.filter((w) => w.courtId === courtId);
      let totalMinutes = 0;
      for (const w of courtWindows) {
        const occurrences = Math.ceil(daysInRange / 7);
        totalMinutes += (w.endMinute - w.startMinute) * occurrences;
      }
      availableHoursByCourt.set(courtId, totalMinutes / 60);
    }

    // Calculate booked hours per court
    const bookedHoursByCourt = new Map<string, number>();
    for (const slot of slots) {
      const startMs = new Date(slot.start_time).getTime();
      const endMs = new Date(slot.end_time).getTime();
      const hours = (endMs - startMs) / (1000 * 60 * 60);
      bookedHoursByCourt.set(
        slot.court_id,
        (bookedHoursByCourt.get(slot.court_id) ?? 0) + hours,
      );
    }

    // Per-court utilization
    const byCourt = courtIds.map((courtId) => {
      const available = availableHoursByCourt.get(courtId) ?? 0;
      const booked = bookedHoursByCourt.get(courtId) ?? 0;
      return {
        courtId,
        courtLabel: courtLabels.get(courtId) ?? courtId,
        utilizationPct:
          available > 0 ? Math.round((booked / available) * 100) : 0,
      };
    });
    byCourt.sort((a, b) => b.utilizationPct - a.utilizationPct);

    // Overall utilization
    const totalAvailable = Array.from(availableHoursByCourt.values()).reduce(
      (a, b) => a + b,
      0,
    );
    const totalBooked = Array.from(bookedHoursByCourt.values()).reduce(
      (a, b) => a + b,
      0,
    );
    const overallUtilizationPct =
      totalAvailable > 0
        ? Math.round((totalBooked / totalAvailable) * 100)
        : 0;

    // Peak utilization (evenings 17-22 + weekends)
    const peakSlots = slots.filter((s) => {
      const d = new Date(s.start_time);
      const hour = d.getHours();
      const dow = d.getDay();
      return dow === 0 || dow === 6 || (hour >= 17 && hour < 22);
    });
    const peakBookedHours = peakSlots.reduce((sum, s) => {
      return (
        sum +
        (new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) /
          (1000 * 60 * 60)
      );
    }, 0);
    // Rough peak available = weekends (2/7 * totalAvailable) + evenings (5h/day * workdays * courts)
    const peakAvailable = totalAvailable > 0 ? totalAvailable * 0.4 : 0;
    const peakUtilizationPct =
      peakAvailable > 0
        ? Math.min(100, Math.round((peakBookedHours / peakAvailable) * 100))
        : 0;

    // Heatmap: calculate utilization % per dow/hour cell
    const courtCount = courtIds.length || 1;
    const weeksInRange = Math.max(1, daysInRange / 7);
    const heatmap = heatmapRaw.map((cell) => ({
      dow: cell.dow,
      hour: cell.hour,
      utilizationPct: Math.min(
        100,
        Math.round((cell.bookedHours / (courtCount * weeksInRange)) * 100),
      ),
    }));

    // Daily utilization trend
    const dailyUtilization = await this.repo.getRevenueByDay(
      courtIds,
      input.from,
      input.to,
      tz,
    );
    const dailyAvailable = totalAvailable / Math.max(1, daysInRange);
    const byDay = dailyUtilization.map((d) => ({
      date: d.date,
      utilizationPct:
        dailyAvailable > 0
          ? Math.min(
              100,
              Math.round((d.bookingCount / (courtCount * 10)) * 100),
            )
          : 0,
    }));

    return {
      kpis: {
        overallUtilizationPct,
        peakUtilizationPct,
        maintenanceHours: Math.round(maintenanceHours * 10) / 10,
      },
      byCourt,
      heatmap,
      byDay,
    };
  }

  async getOperations(input: AnalyticsInput): Promise<OperationsOutput> {
    const courtIds = await this.repo.getCourtIdsForOrganization(
      input.organizationId,
    );
    const tz = await this.repo.getPlaceTimeZone(input.organizationId);

    const [
      responseTimes,
      cancellationRaw,
      totalCount,
      leadTimes,
      bookingsByHour,
    ] = await Promise.all([
      this.repo.getResponseTimes(courtIds, input.from, input.to),
      this.repo.getCancellationBreakdown(courtIds, input.from, input.to),
      this.repo.getTotalReservationCount(courtIds, input.from, input.to),
      this.repo.getLeadTimes(courtIds, input.from, input.to),
      this.repo.getBookingsByHourCreated(courtIds, input.from, input.to, tz),
    ]);

    // Median response time
    const sorted = [...responseTimes].sort((a, b) => a - b);
    const medianResponseMinutes =
      sorted.length > 0
        ? Math.round(sorted[Math.floor(sorted.length / 2)])
        : null;

    // Response time histogram
    const responseTimeBuckets = RESPONSE_TIME_BUCKETS.map((bucket) => {
      const prevMax =
        RESPONSE_TIME_BUCKETS[RESPONSE_TIME_BUCKETS.indexOf(bucket) - 1]
          ?.max ?? 0;
      const count = responseTimes.filter(
        (t) => t >= prevMax && t < bucket.max,
      ).length;
      return {
        bucket: bucket.label,
        count,
        pct:
          responseTimes.length > 0
            ? Math.round((count / responseTimes.length) * 100)
            : 0,
      };
    });

    // Cancellation breakdown
    const cancelTotal = cancellationRaw.reduce((s, r) => s + r.count, 0);
    const cancellationBreakdown = cancellationRaw.map((r) => ({
      reason: r.reason,
      count: r.count,
      pct: cancelTotal > 0 ? Math.round((r.count / cancelTotal) * 100) : 0,
    }));
    const cancellationRate =
      totalCount > 0
        ? Math.round((cancelTotal / totalCount) * 100)
        : 0;

    // Lead time buckets
    const leadTimeBuckets = LEAD_TIME_BUCKETS.map((bucket) => {
      const prevMax =
        LEAD_TIME_BUCKETS[LEAD_TIME_BUCKETS.indexOf(bucket) - 1]?.maxHours ?? 0;
      const count = leadTimes.filter(
        (t) => t >= prevMax && t < bucket.maxHours,
      ).length;
      return {
        bucket: bucket.label,
        count,
        pct:
          leadTimes.length > 0
            ? Math.round((count / leadTimes.length) * 100)
            : 0,
      };
    });

    // Avg lead time
    const avgLeadTimeHours =
      leadTimes.length > 0
        ? Math.round(
            (leadTimes.reduce((s, t) => s + t, 0) / leadTimes.length) * 10,
          ) / 10
        : null;

    return {
      kpis: {
        medianResponseMinutes,
        cancellationRate,
        avgLeadTimeHours,
      },
      responseTimeBuckets,
      cancellationBreakdown,
      leadTimeBuckets,
      bookingsByHourCreated: bookingsByHour,
    };
  }
}
