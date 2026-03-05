import { z } from "zod";
import { S } from "@/common/schemas";

// ── Shared Input ────────────────────────────────────────────────────────────

export const AnalyticsInputSchema = z.object({
  organizationId: S.ids.organizationId,
  from: S.common.isoDateTime,
  to: S.common.isoDateTime,
});

export type AnalyticsInput = z.infer<typeof AnalyticsInputSchema>;

// ── Revenue Output ──────────────────────────────────────────────────────────

const RevenueByDaySchema = z.object({
  date: z.string(),
  totalCents: z.number(),
  bookingCount: z.number(),
});

const RevenueByCourtSchema = z.object({
  courtId: z.string(),
  courtLabel: z.string(),
  totalCents: z.number(),
});

const RevenueByDowSchema = z.object({
  dow: z.number(),
  totalCents: z.number(),
});

const RevenueByHourSchema = z.object({
  hour: z.number(),
  totalCents: z.number(),
});

export const RevenueOutputSchema = z.object({
  kpis: z.object({
    totalRevenueCents: z.number(),
    avgBookingValueCents: z.number(),
    bookingCount: z.number(),
    previousTotalRevenueCents: z.number(),
    previousBookingCount: z.number(),
  }),
  byDay: z.array(RevenueByDaySchema),
  byCourt: z.array(RevenueByCourtSchema),
  byDow: z.array(RevenueByDowSchema),
  byHour: z.array(RevenueByHourSchema),
  previousByDay: z.array(RevenueByDaySchema),
});

export type RevenueOutput = z.infer<typeof RevenueOutputSchema>;

// ── Utilization Output ──────────────────────────────────────────────────────

const UtilizationByCourtSchema = z.object({
  courtId: z.string(),
  courtLabel: z.string(),
  utilizationPct: z.number(),
});

const HeatmapCellSchema = z.object({
  dow: z.number(),
  hour: z.number(),
  utilizationPct: z.number(),
});

const UtilizationByDaySchema = z.object({
  date: z.string(),
  utilizationPct: z.number(),
});

export const UtilizationOutputSchema = z.object({
  kpis: z.object({
    overallUtilizationPct: z.number(),
    peakUtilizationPct: z.number(),
    maintenanceHours: z.number(),
  }),
  byCourt: z.array(UtilizationByCourtSchema),
  heatmap: z.array(HeatmapCellSchema),
  byDay: z.array(UtilizationByDaySchema),
});

export type UtilizationOutput = z.infer<typeof UtilizationOutputSchema>;

// ── Operations Output ───────────────────────────────────────────────────────

const ResponseTimeBucketSchema = z.object({
  bucket: z.string(),
  count: z.number(),
  pct: z.number(),
});

const CancellationBreakdownSchema = z.object({
  reason: z.string(),
  count: z.number(),
  pct: z.number(),
});

const LeadTimeBucketSchema = z.object({
  bucket: z.string(),
  count: z.number(),
  pct: z.number(),
});

const BookingsByHourCreatedSchema = z.object({
  hour: z.number(),
  count: z.number(),
});

export const OperationsOutputSchema = z.object({
  kpis: z.object({
    medianResponseMinutes: z.number().nullable(),
    cancellationRate: z.number(),
    avgLeadTimeHours: z.number().nullable(),
  }),
  responseTimeBuckets: z.array(ResponseTimeBucketSchema),
  cancellationBreakdown: z.array(CancellationBreakdownSchema),
  leadTimeBuckets: z.array(LeadTimeBucketSchema),
  bookingsByHourCreated: z.array(BookingsByHourCreatedSchema),
});

export type OperationsOutput = z.infer<typeof OperationsOutputSchema>;
